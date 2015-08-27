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

RFDUINO_SERVICE_UUID = ("00002220-0000-1000-8000-00805F9B34FB");
RECEIVE_CHARACTERISTIC_UUID = ("00002221-0000-1000-8000-00805F9B34FB");
SEND_CHARACTERISTIC_UUID = ("00002222-0000-1000-8000-00805F9B34FB");
DISCONNECT_CHARACTERISTIC_UUID = ("00002223-0000-1000-8000-00805F9B34FB");

    // 0x2902 org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
CLIENT_CHARACTERISTIC_CONFIGURATION_UUID = ("00002902-0000-1000-8000-00805F9B34FB");


var app = {
initialize: function() {
console.log('Init');
  this.bindEvents();
chrome.bluetooth.onAdapterStateChanged.addListener(
  function(adapter) {
console.log(adapter.powered);
/*    if (adapter.powered != powered) {
      powered = adapter.powered;
      if (powered) {
        console.log("Adapter radio is on");
      } else {
        console.log("Adapter radio is off");
      }
    }*/
  });//    detailPage.hidden = true;  //ChromeBook
    $('#detailPage').hide();
},
bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
//    refreshButton.addEventListener('touchstart', this.refreshDeviceList, false); //ChromeBook
    $('#refreshButton').click(this.refreshDeviceList);
//    closeButton.addEventListener('touchstart', this.disconnect, false);
    $('#closeButton').click(this.disconnect);
},

//onDeviceReady: function() {  //ChromeBook
//    app.refreshDeviceList();
//},
    
refreshDeviceList: function() {
  console.log('refreshDeviceList');
    $("#deviceList").hide();
    $("#notfound").show();
    devices = []; // empties the list
    chrome.bluetooth.onDeviceAdded.addListener(app.onDiscoverDevice);  //ChromeBook
    chrome.bluetooth.startDiscovery(function() {console.log('Discover');});  //ChromeBook
//    rfduino.discover(5, app.onDiscoverDevice, app.onError);  //ChromeBook
},
    
onDiscoverDevice: function(device) {
  console.log('onDiscoverDevice');
    $("#notfound").hide();
    $("#deviceList").show();
    deviceList.innerHTML = '';
    devices.push (device);
    devices = devices.sort(function(a, b) {
                           return (b.inquiryRssi - a.inquiryRssi);});  //ChromeBook
//                           return (b.rssi - a.rssi);});  //ChromeBook
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
    chrome.bluetooth.stopDiscovery(function() {}); //ChromeBook
    app.showDetailPage();
    var uuid = this.getAttribute('uuid'),name=this.innerHTML,
    onConnect = function() {
//        rfduino.onData(app.onData, app.onError);  //ChromeBook
        
        deviceUUID.innerHTML = name;
    };
    deviceUUID.innerHTML = "Connecting";
    data0.innerHTML = "";
    data1.innerHTML = "";
    data2.innerHTML = "";
    data3.innerHTML = "";
//    rfduino.connect(uuid, onConnect);  //ChromeBook

  chrome.bluetoothLowEnergy.connect(device.address, function () {
    if (chrome.runtime.lastError) {
      console.log('Failed to connect: ' + chrome.runtime.lastError.message);
      return;
    }

    chrome.bluetoothLowEnergy.getServices(deviceAddress, function(services) {
      for (var i = 0; i < services.length; i++) {
        if (services[i].uuid == RFDUINO_SERVICE_UUID) {
          service = services[i];
          break;
        }
      }
    chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                             function(chracteristics) {
      for (var i = 0; i < characteristics.length; i++) {
        if (characteristics[i].uuid == HEART_RATE_MEASUREMENT_UUID) {
          chrc = characteristics[i];
          break;
        }
      }
      chrome.bluetoothLowEnergy.startCharacteristicNotifications(chrc.instanceId,
        function() {
          if (chrome.runtime.lastError) {
            console.log('Failed to enable notifications: ' +
                  chrome.runtime.lastError.message);
          return;
        }
      });

      chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(
        function(chrc) {
          if (chrc.instanceId != myCharId)  return;

         onData (chrc.value);
        });       
      });
    });
  });
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
//    rfduino.disconnect(app.showMainPage, app.onError);  //ChromeBook
},
showMainPage: function() {
//    mainPage.hidden = false;  //ChromeBook
    $('#mainPage').show();
//    detailPage.hidden = true;  //ChromeBook
    $('#detailPage').hide();
},
showDetailPage: function() {
//    mainPage.hidden = true;  //ChromeBook
    $('#mainPage').hide();
//    detailPage.hidden = false;  //ChromeBook
    $('#detailPage').show();
},
onError: function(reason) {
    alert(reason);
}
}; 
window.onload = function() { //ChromeBook
  app.initialize();
  app.refreshDeviceList();
};


