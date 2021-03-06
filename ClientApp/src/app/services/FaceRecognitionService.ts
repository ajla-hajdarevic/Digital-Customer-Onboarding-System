import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FaceRecognitionResponse } from '../models/FaceRecognitionResponse';


@Injectable({providedIn:'root'})
export class FaceRecognitionService {
  constructor(private httpClient: HttpClient) {}

  scanImage(subscriptionKey: string, base64Image: string) {
    const headers = this.getHeaders(subscriptionKey);
    const params = this.getParams();
    const blob = this.makeblob(base64Image);

    return this.httpClient.post<FaceRecognitionResponse>(
      environment.endpoint,
      blob,
      {
        params,
        headers,
      }
    );
  }

  scanVerifyImage(subscriptionKey: string,faceId1:string,faceId2:string) {
    const headers = this.getHeaders(subscriptionKey);
    const body ={
        "faceId1": faceId1,
        "faceId2": faceId2
    }

    return this.httpClient.post(environment.endpoint,body,{headers});
    }


  private makeblob(dataURL) {
    const BASE64_MARKER = ';base64,';
    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  private getHeaders(subscriptionKey: string) {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/octet-stream');
    headers = headers.set('Ocp-Apim-Subscription-Key', subscriptionKey);

    return headers;
  }

  private getParams() {
    const httpParams = new HttpParams()
      .set('returnFaceId', 'true');
    return httpParams;
  }

  

  private getIdentifyParams() {
    const httpParams = new HttpParams()
      .set('faceId1', localStorage.getItem('faceId1'))
      .set('faceId2', localStorage.getItem('faceId2'));
    return httpParams;
  }
}
