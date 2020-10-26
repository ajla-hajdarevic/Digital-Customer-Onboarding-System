import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as $ from 'jquery';
import { ComputervisionService } from './services/computervision.service';
import { OcrResult } from './models/ocrresult';
import { ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { FaceRecognitionResponse } from './models/FaceRecognitionResponse';
import { FaceRecognitionService } from './services/FaceRecognitionService';
import { DesktopCameraService } from './services/DesktopCameraService';
import { switchMap, map } from 'rxjs/operators';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ajla';
  imageString = '';
  subscriptionKey: string = '102104286452489997971e765a7afc4b';
  frontFileData: File = null;
  backFileData: File = null;
  frontImgPreviewUrl: any = null;
  frontImgShow: boolean = false;
  backImgShow: boolean = false;
  backImgPreviewUrl: any = null;
  fileUploadProgress: string = null;
  uploadedFilePath: string = null;
  chkBox: boolean = false;
  btnContinue: boolean = true;
  imageData = new FormData();
  ocrResult = new OcrResult();
  faceApiResponse: Observable<FaceRecognitionResponse>;
  faceId2: string;
  @ViewChild('video', { read: true }) videoElement: ElementRef;
  @ViewChild('canvas', { read: true }) canvas: ElementRef;

  facesResult: string = '';
  imageURL: string = '';
  color: string = '';
  opis: string='';
  div1:boolean = false;

  videoWidth = 0;
  videoHeight = 0;
  constraints = {
    video: {
      facingMode: "environment",
      width: { ideal: 400 },
      height: { ideal: 400 }
    }
  };

  constructor(
    private ref: ChangeDetectorRef,
    private http: HttpClient,
    private computervisionService: ComputervisionService,
    private renderer: Renderer2,
    private faceRecognitionService: FaceRecognitionService,
    private cameraService: DesktopCameraService
  ) {

    setInterval(() => {
      this.ref.detectChanges()
    }, 1000);
  }


  startCamera() {
    if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      navigator.mediaDevices.getUserMedia(this.constraints).then(this.attachVideo.bind(this)).catch(this.handleError);
    } else {
      alert('Sorry, camera not available.');
    }
  }

  attachVideo(stream) {
    this.renderer.setProperty(this.videoElement.nativeElement, 'srcObject', stream);
    this.renderer.listen(this.videoElement.nativeElement, 'play', (event) => {
      this.videoHeight = this.videoElement.nativeElement.videoHeight;
      this.videoWidth = this.videoElement.nativeElement.videoWidth;
    });
  }

  capture() {
    this.renderer.setProperty(this.canvas.nativeElement, 'width', this.videoWidth);
    this.renderer.setProperty(this.canvas.nativeElement, 'height', this.videoHeight);
    this.canvas.nativeElement.getContext('2d').drawImage(this.videoElement.nativeElement, 0, 0);
  }

  handleError(error) {
    console.log('Error: ', error);
  }

alertFunction(){
  this.div1 = true;
}

  ngOnInit(): void {
    $('#imagePreviewFront').hide();
    $('#imagePreviewBack').hide();
  }
  checkValue(event: any) {
    if (event.target.checked && this.frontImgShow && this.backImgShow) {
      this.btnContinue = false;
      this.chkBox = event.target.checked;
    }
    else {
      this.btnContinue = true;
      this.chkBox = event.target.checked;
    }
  }
  onContinue() {
    this.computervisionService.getTextFromImage(this.imageData).subscribe(
      (result: OcrResult) => {
        this.ocrResult = result;
        localStorage.setItem("faceId1", this.ocrResult.faceId1);
        step1Disable();
        step2Visibile();
      });
  }

  onContinueNext() {
    step2Disable();

    $(".step3").css('display', 'block');
    $("#step3Caption").addClass('active');
    //this.startCamera();
    this.captureImage();

  }

  onStartOver(){
   window.location.reload();
   
  }



  captureImage() {
    this.faceApiResponse = this.cameraService.getPhoto().pipe(switchMap((base64Image: string) => {
      this.imageString = base64Image;
      return this.faceRecognitionService.scanImage(
        this.subscriptionKey,
        base64Image
      );
    })
    );
  }

  onCaptureImage() {

    var faceId2 = (<HTMLInputElement>document.getElementById('faceId2value')).value;

    this.computervisionService.matchImages(localStorage.getItem('faceId1'), faceId2).subscribe((res: any) => {


      $(".step3").css('display', 'none');
      $("#step3Caption").removeClass('active');

      $(".step4").css('display', 'block');
      $("#step4Caption").addClass('active');
      if (res.isIdentical == true) {
        this.facesResult = 'Identity valid';
         this.imageURL = require('./../assets/images/correct.svg')
        this.opis = "Congratulations! You successfully completed the customer onboarding process!"
        this.color = "green"
        
      } else if (res.isIdentical == false) {
        this.facesResult = 'Identity invalid';
         this.imageURL = require('./../assets/images/close.svg')
        this.opis = "Unfortunately, the identity verification is not valid. Please try again."
        this.color = "red"

      }
      else {
        this.facesResult = 'FaceId invalid'
      }

    });



  }

  fileProgress(fileInput: any) {
    this.frontFileData = <File>fileInput.target.files[0];
    this.imageData.append('frontImg', this.frontFileData);
    this.frontImgpreview();
  }
  fileBackProgress(fileInput: any) {
    this.backFileData = <File>fileInput.target.files[0];
    this.imageData.append('backImg', this.backFileData);
    this.backImgpreview();
  }
  frontImgpreview() {
    // Show preview 
    var mimeType = this.frontFileData.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    var reader = new FileReader();
    reader.readAsDataURL(this.frontFileData);
    reader.onload = (_event) => {
      this.frontImgPreviewUrl = reader.result;
      if (this.frontImgPreviewUrl) {
        $('#imagePreviewFront').css('background-image', 'url(' + _event.target.result + ')');
        $('#imagePreviewFront').hide();
        $('#imagePreviewFront').fadeIn(650);
        if (this.chkBox && this.backImgShow) {
          this.btnContinue = false;
          this.frontImgShow = true;
        }
        else {
          this.frontImgShow = true;
        }
        $('#frontImgUpload').css('display', 'none');
      }
    }
  }

  backImgpreview() {
    // Show preview 
    var mimeType = this.backFileData.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    var reader = new FileReader();
    reader.readAsDataURL(this.backFileData);
    reader.onload = (_event) => {
      this.backImgPreviewUrl = reader.result;
      if (this.backImgPreviewUrl) {
        $('#imagePreviewBack').css('background-image', 'url(' + _event.target.result + ')');
        $('#imagePreviewBack').hide();
        $('#imagePreviewBack').fadeIn(650);
        if (this.chkBox && this.frontImgShow) {
          this.btnContinue = false;
          this.backImgShow = true;
        }
        else {
          this.backImgShow = true;
        }
        $('#backImgUpload').css('display', 'none');
      }
    }
  }


  files: any[] = [];

  /**
   * on file drop handler
   */
  onFileDropped($event) {
    this.prepareFilesList($event);
  }
  onBackFileDropped($event) {
    this.prepareFilesList($event);
  }
  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteImgFront(index: number) {
    $('#frontImgUpload').css('display', 'block');
    $('#imagePreviewFront').hide();

  }
  deleteImgBack(index: number) {
    $('#backImgUpload').css('display', 'block');
    $('#imagePreviewBack').hide();
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[index].progress === 100) {
            clearInterval(progressInterval);
            this.uploadFilesSimulator(index + 1);
          } else {
            this.files[index].progress += 5;
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: Array<any>) {
    for (const item of files) {
      item.progress = 0;
      this.files.push(item);
    }
    this.uploadFilesSimulator(0);
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes, decimals) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


}

function step1Disable() {
  document.getElementById("step1").style.display = "none";
  var element = document.getElementById("step1Caption");
  element.classList.remove("active");
}



function step1Visibile() {
  document.getElementById("step1").style.display = "block";
  var element = document.getElementById("step1Caption");
  element.classList.add("active");
}

// function step5Visibile() {
//   document.getElementById("step5").style.display = "block";
//   document.getElementById("step4").style.display = "none";
//   var element = document.getElementById("step4Caption");
//   element.classList.add("active");
// }
function step2Disable() {
  document.getElementById("step2").style.display = "none";
  var element = document.getElementById("step2Caption");
  element.classList.remove("active");
}

function step2Visibile() {
  document.getElementById("step2").style.display = "block";
  var element = document.getElementById("step2Caption");
  element.classList.add("active");
}
function step3Disable() {
  document.getElementById("step3").style.display = "none";
  var element = document.getElementById("step3Caption");
  element.classList.remove("active");
}

function step3Visibile() {
  document.getElementById("step3").style.display = "block";
  var element = document.getElementById("step3Caption");
  element.classList.add("active");
}

function step4Disable() {
  document.getElementById("step4").style.display = "none";
  var element = document.getElementById("step4Caption");
  element.classList.remove("active");
}

function step4Visibile() {
  document.getElementById("step4").style.display = "block";
  document.getElementById("step3").style.display = "none";
  var element = document.getElementById("step3Caption");
  element.classList.add("active");
}
