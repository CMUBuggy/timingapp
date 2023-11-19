import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages: string[] = [];

  add(message: string) {
    console.error("Message: " + message);
    this.messages.push(message);
  }

  clear() {
    this.messages = [];
  }
}