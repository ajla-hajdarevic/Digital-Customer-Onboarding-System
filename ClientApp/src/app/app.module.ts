import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ArchwizardModule } from 'angular-archwizard';
import { DndDirective } from './dnd.directive';
import { FaceRecognitionService } from './services/FaceRecognitionService';
import { DesktopCameraService } from './services/DesktopCameraService';
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    AppComponent,
    DndDirective
  ],
  imports: [
    BrowserModule,
    ArchwizardModule,
    HttpClientModule,
    FormsModule 
  ],
  providers: [FaceRecognitionService,DesktopCameraService],
  bootstrap: [AppComponent]
})
export class AppModule { }
