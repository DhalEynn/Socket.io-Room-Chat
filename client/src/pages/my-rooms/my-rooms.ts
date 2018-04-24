import { Component } from '@angular/core';
import {Events, NavController} from 'ionic-angular';
import {ChooseRoomPage} from "../choose-room/choose-room";
import {RoomsProvider} from "../../providers/rooms/rooms";
import {UsersProvider} from "../../providers/users/users";
import {Socket} from 'ng-socket-io';
import {MessagesPage} from "../messages/messages";

@Component({
  selector: 'page-my-rooms',
  templateUrl: 'my-rooms.html',
})
export class MyRoomsPage {

  constructor(public navCtrl: NavController, public socket: Socket, event:Events,
              public roomsProvider: RoomsProvider, public usersProvider: UsersProvider) {

      this.socket.on('go room', data => {
          this.navCtrl.push(MessagesPage, data);
      });

  }

  addRoom() {
      this.navCtrl.push(ChooseRoomPage);
  }

    logout() {
        this.socket.disconnect();
        this.navCtrl.popToRoot();
    }

    roomSelected(room) {
        this.socket.emit('join room', room);
    }

}