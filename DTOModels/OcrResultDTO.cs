using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CustomerOnboarding.DTOModels
{
    public class OcrResultDTO
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string DOB { get; set; }
        public string IDCard { get; set; }
        public string faceId1 { get; set; }
        public string sid { get; set; }
        public string validUntil { get; set; }
        public string birthPlace { get; set; }

        public byte[] ImageFront { get; set; }
        public byte[] ImageBack { get; set; }

    }
}
