import { Component } from '@angular/core';
import { FileService } from './file.service';
import { saveAs } from 'file-saver';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  filenames: string[] = [];
  fileStatus = { status: '', requestType: '', percent: 0 };

  constructor(private fileService: FileService) {}

  uploadFiles(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files: FileList | null = element.files;

    if (files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i], files[i].name);
      }
      this.fileService.upload(formData).subscribe(
        (event) => {
          console.log(event);
          this.reportProgress(event);
        },
        (error: HttpErrorResponse) => {
          console.log(error);
        }
      );
    }
  }

  downloadFiles(filename: string): void {
    this.fileService.download(filename).subscribe(
      (event) => {
        console.log(event);
        this.reportProgress(event);
      },
      (error: HttpErrorResponse) => {
        console.log(error);
      }
    );
  }

  private reportProgress(HttpEvent: HttpEvent<string[] | Blob>): void {
    switch (HttpEvent.type) {
      case HttpEventType.UploadProgress:
        this.updateStatus(HttpEvent.loaded, HttpEvent.total, 'Uploading');
        break;
      case HttpEventType.DownloadProgress:
        this.updateStatus(HttpEvent.loaded, HttpEvent.total, 'Downloading');
        break;
      case HttpEventType.ResponseHeader:
        console.log('Header returned', HttpEvent);
        break;
      case HttpEventType.Response:
        if (HttpEvent.body instanceof Array) {
          for (const filename of HttpEvent.body) {
            this.filenames.unshift(filename);
          }
        } else {
          saveAs(
            new File([HttpEvent.body], HttpEvent.headers.get('File-Name'), {
              type: `${HttpEvent.headers.get('Content-Type')}; charset=utf-8`,
            })
          );
          saveAs(
            new Blob([HttpEvent.body], {
              type: `${HttpEvent.headers.get('Content-Type')}; charset=utf-8`,
            }),
            HttpEvent.headers.get('File-Name')
          );
        }
        break;
      default:
        console.log(HttpEvent);
        break;
    }
  }

  private updateStatus(loaded: number, total: number, requestType: string) {
    this.fileStatus.status = 'progress';
    this.fileStatus.requestType = requestType;
    this.fileStatus.percent = Math.round((100 * loaded) / total);
  }
}
