using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CustomerOnboarding.Models
{
    public class FaceModel
    {
        public string faceId { get; set; }
    }

    public class FaceDetectionResponse
    {
        public bool isIdentical { get; set; }
        public string confidence { get; set; }
    }
}
