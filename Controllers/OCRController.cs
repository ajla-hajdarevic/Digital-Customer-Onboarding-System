using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using CustomerOnboarding.DTOModels;
using CustomerOnboarding.Models;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CustomerOnboarding.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class OCRController : Controller
    {
        static string subscriptionKey;
        static string endpoint;
        static string uriBase;
        FaceDetectionResponse faceDetectionResponse = new FaceDetectionResponse();

        private IConfiguration Configuration;
        public OCRController(IConfiguration _configuration)
        {
            subscriptionKey = "102104286452489997971e765a7afc4b";
            endpoint = "https://eastus.api.cognitive.microsoft.com/";
            uriBase = endpoint + "vision/v2.1/ocr";
            Configuration = _configuration;
        }
        [HttpPost, DisableRequestSizeLimit]
        public async Task<IActionResult> Post()
        {
            StringBuilder sb = new StringBuilder();
            OcrResultDTO ocrResultDTO = new OcrResultDTO();
            try
            {
                List<byte[]> byteDataArray = new List<byte[]>();
                if (Request.Form.Files.Count > 0)
                {
                    var file1 = Request.Form.Files[0];
                    if (file1.Length > 0)
                    {
                        MemoryStream memoryStream1 = new MemoryStream();
                        file1.CopyTo(memoryStream1);
                        byte[] imageFileBytes1 = memoryStream1.ToArray();
                        ocrResultDTO.ImageFront = imageFileBytes1;
                        byteDataArray.Add(imageFileBytes1);
                        memoryStream1.Flush();
                    }
                    var file2 = Request.Form.Files[1];
                    if (file2.Length > 0)
                    {
                        MemoryStream memoryStream2 = new MemoryStream();
                        file2.CopyTo(memoryStream2);
                        byte[] imageFileBytes2 = memoryStream2.ToArray();
                        ocrResultDTO.ImageBack = imageFileBytes2;
                        byteDataArray.Add(imageFileBytes2);
                        memoryStream2.Flush();
                    }
                    var JSONResult = await ReadTextFromStream(byteDataArray);
                    for (int i = 0; i < JSONResult.Count; i++)
                    {
                        OcrResult ocrResult = JsonConvert.DeserializeObject<OcrResult>(JSONResult[i]);
                        if (!ocrResult.Language.Equals("unk"))
                        {
                            if (JSONResult.IndexOf(JSONResult[i]) == 0)
                            {
                                string faceIdString = await GetFaceId(byteDataArray[0]);
                                List<FaceModel> jObj = JsonConvert.DeserializeObject<List<FaceModel>>(faceIdString);

                                string surname = ocrResult.Regions[1].Lines[6].Words[0].Text.ToString();
                                string name = ocrResult.Regions[1].Lines[10].Words[0].Text.ToString();
                                string dob = ocrResult.Regions[1].Lines[15].Words[0].Text.ToString();
                                string sid = ocrResult.Regions[0].Lines[4].Words[0].Text.ToString();
                                string validUntil = ocrResult.Regions[1].Lines[18].Words[0].Text.ToString();
                                


                                ocrResultDTO.Name = name;
                                ocrResultDTO.Surname = surname;
                                ocrResultDTO.DOB = dob;
                                ocrResultDTO.sid = sid;
                                ocrResultDTO.validUntil=validUntil;
                               

                                ocrResultDTO.faceId1 = jObj[0].faceId;
                            }
                            else
                            {
                                string IdCard = ocrResult.Regions[1].Lines[1].Words[0].Text;
                                string birthPlace = ocrResult.Regions[0].Lines[1].Words[0].Text.ToString();
                                ocrResultDTO.IDCard = IdCard;
                                 ocrResultDTO.birthPlace=birthPlace;
                                
                            }

                        }
                        else
                        {
                            sb.Append("This language is not supported.");
                        }

                  
                    }
                }

                if (ocrResultDTO.Name!=null && ocrResultDTO.IDCard !=null)
                {
                    using (SqlConnection con = new SqlConnection(Configuration.GetConnectionString("DefaultConnection")))
                    {
                        try
                        {
                            con.Open();

                            using (SqlCommand cmd = new SqlCommand())
                            {
                                cmd.Connection = con;
                                cmd.CommandTimeout = 500;


                                cmd.CommandText = "INSERT INTO CustomerOnBoarding (FaceId,Name,Surname,DOB,IDCard,ImageFrontSide,ImageBackSide) VALUES ('" + ocrResultDTO.faceId1 + "','" + ocrResultDTO.Name + "','" + ocrResultDTO.Surname + "','" + ocrResultDTO.DOB + "','" + ocrResultDTO.IDCard + "',@ImageFront,@ImageBack)";

                                cmd.Parameters.Add(new SqlParameter("@ImageFront", System.Data.SqlDbType.Image) { Value = ocrResultDTO.ImageFront });
                                cmd.Parameters.Add(new SqlParameter("@ImageBack", System.Data.SqlDbType.Image) { Value = ocrResultDTO.ImageBack });
                                cmd.ExecuteNonQuery();


                            }
                        }
                        catch (Exception ex)
                        {
                            Ok(ex.Message);
                        }
                    }
                }
                return Ok(ocrResultDTO);

            }
            catch (Exception ex)
            {
                return Ok(ex.Message);
            }
        }
        static async Task<List<string>> ReadTextFromStream(List<byte[]> byteData)
        {

            try
            {
                string contentString = string.Empty;
                List<string> result = new List<string>();
                HttpClient client = new HttpClient();
                client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                string requestParameters = "language=unk&detectOrientation=true";
                string uri = uriBase + "?" + requestParameters;
                HttpResponseMessage response = new HttpResponseMessage();
                for (int i = 0; i < byteData.Count; i++)
                {
                    using (ByteArrayContent content = new ByteArrayContent(byteData[i]))
                    {
                        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                        response = await client.PostAsync(uri, content);
                    }
                    contentString = await response.Content.ReadAsStringAsync();
                    result.Add(JToken.Parse(contentString).ToString());
                }

                return result;
            }
            catch (Exception e)
            {
                throw e;
            }

        }

        static async Task<string> GetFaceId(byte[] byteData)
        {

            try
            {
                string result = "";
                var client = new HttpClient();
                var queryString = HttpUtility.ParseQueryString(string.Empty);

                // Request headers
                client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", subscriptionKey);

                // Request parameters
                queryString["returnFaceId"] = "true";

                var uri = "https://eastus.api.cognitive.microsoft.com/face/v1.0/detect?" + queryString;

                HttpResponseMessage response;

                using (ByteArrayContent content = new ByteArrayContent(byteData))
                {
                    content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                    response = await client.PostAsync(uri, content);
                }

                return result = JToken.Parse(await response.Content.ReadAsStringAsync()).ToString();
            }
            catch (Exception e)
            {
                return e.Message;
            }
        }
        [HttpPost("MatchImages")]
        public async Task<IActionResult> MatchImages([FromBody] ImageViewModel imageViewModel)
        {
            try
            {
                var url = "https://eastus.api.cognitive.microsoft.com/face/v1.0/verify";

                HttpClient client = new HttpClient();
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                // client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var values = new Dictionary<object, object>
                {
                {"faceId1", imageViewModel.FaceId1},
                {"faceId2", imageViewModel.FaceId2}
                };
                var content = new StringContent(JsonConvert.SerializeObject(values), Encoding.UTF8, "application/json");
                HttpResponseMessage responseMessageAuthToken = await client.PostAsync(url, content);


                if (responseMessageAuthToken.IsSuccessStatusCode)
                {
                    var responseJsonAuthToken = await responseMessageAuthToken.Content.ReadAsStringAsync();
                    var jObjectAuthToken = JObject.Parse(responseJsonAuthToken);

                    faceDetectionResponse.isIdentical = Convert.ToBoolean(jObjectAuthToken.GetValue("isIdentical").ToString());
                    faceDetectionResponse.confidence = jObjectAuthToken.GetValue("confidence").ToString();

                }
            }
            catch (Exception e)
            {
                return Ok(e.Message);
            }
            return Ok(faceDetectionResponse);
        }

    }
}
