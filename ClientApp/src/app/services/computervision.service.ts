import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ComputervisionService {

  baseURL: string;

  constructor(private http: HttpClient) {
    this.baseURL = '/api/OCR';
  }

  matchImages(faceId1:string,faceId2:string) {
    let obj={FaceId1 :faceId1,FaceId2:faceId2}
    return this.http.post(this.baseURL+'/MatchImages',obj)
      .pipe(response => {
        return response;
      });
  }

  getTextFromImage(image: FormData) {
    return this.http.post(this.baseURL, image)
      .pipe(response => {
        return response;
      });
  }
}