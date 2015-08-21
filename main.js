// (c) 2015 Bill Zimmer
// for Concord Consortium
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, tempFahrenheit, tempCelsius, closeButton */
/* global rfduino, alert */

var soilZero = 255;
var soilSlope = -1.4;
// .4   --> 8    --> 60
//  7.0 --> 11.5 --> 670

var lightZero = 0;
var lightSlope = 25/100;
var devices = [];

var app = {
initialize: function() {
    this.bindEvents();
    detailPage.hidden = true;
},
bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
    closeButton.addEventListener('touchstart', this.disconnect, false);
},
onDeviceReady: function() {
    app.refreshDeviceList();
},
    
refreshDeviceList: function() {
    $("#deviceList").hide();
    $("#notfound").show();
    devices = []; // empties the list
    rfduino.discover(5, app.onDiscoverDevice, app.onError);
},
    
onDiscoverDevice: function(device) {
    $("#notfound").hide();
    $("#deviceList").show();
    deviceList.innerHTML = '';
    devices.push (device);
    devices = devices.sort(function(a, b) {
                           return (b.rssi - a.rssi);});
    for (var idevice in devices) {
        var listItem = document.createElement('li');
        listItem.onclick = app.connect; // assume not scrolling
        var html = '<b>' + devices[idevice].name + '</b>';
        listItem.setAttribute('uuid', devices[idevice].uuid);
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);
    }
},
    
connect: function(e) {
    app.showDetailPage();
    var uuid = this.getAttribute('uuid'),name=this.innerHTML,
    onConnect = function() {
        rfduino.onData(app.onData, app.onError);
        deviceUUID.innerHTML = name;
    };
    deviceUUID.innerHTML = "Connecting";
    data0.innerHTML = "";
    data1.innerHTML = "";
    data2.innerHTML = "";
    data3.innerHTML = "";
    rfduino.connect(uuid, onConnect);
},
onData: function(data) {
    console.log(data);
    var a = new Uint16Array(data);
    if      (a[0] < 1024) {data0.innerHTML = a[0]/10;}
    else if (a[0] < 2048) {data1.innerHTML = (a[0]-1024);}
    else if (a[0] < 3072) {data2.innerHTML = Math.max(0,Math.round((a[0]-2048-soilZero)/soilSlope));}
    else                  {data3.innerHTML = Math.max(0,Math.round((a[0]-3072-lightZero)/lightSlope*10)/10);}
},
disconnect: function() {
    deviceUUID.innerHTML = "Water Tracker";
    rfduino.disconnect(app.showMainPage, app.onError);
},
showMainPage: function() {
    mainPage.hidden = false;
    detailPage.hidden = true;
},
showDetailPage: function() {
    mainPage.hidden = true;
    detailPage.hidden = false;
},
onError: function(reason) {
    alert(reason);
}
};            app.initialize();
