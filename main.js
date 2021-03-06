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

var soilZero = 255;
var soilSlope = -1.4;

var lightZero = 0;
var lightSlope = 25/100;
var devices = [];

RFDUINO_SERVICE_UUID = ("00002220-0000-1000-8000-00805f9b34fb");
RECEIVE_CHARACTERISTIC_UUID = ("00002221-0000-1000-8000-00805f9b34fb");
SEND_CHARACTERISTIC_UUID = ("00002222-0000-1000-8000-00805f9b34fb");
DISCONNECT_CHARACTERISTIC_UUID = ("00002223-0000-1000-8000-00805f9b34fb");
CLIENT_CHARACTERISTIC_CONFIGURATION_UUID = ("00002902-0000-1000-8000-00805F9B34FB");
TITLE = "Water Tracker - Chromebook - V.01";

var app = {
service: undefined,
uuid: undefined,
data: undefined,
disConnectCmd: undefined,
discovering: undefined,

initialize: function() {
console.log('Init');
  this.bindEvents();
  app.service= undefined;
  app.uuid= undefined;
  app.discovering= undefined;
  chrome.bluetooth.getAdapterState(function(adapter) {
    console.log('address='+adapter.address);
    console.log('name='+adapter.name);
    console.log('powered='+adapter.powered);
    console.log('available='+adapter.available);
    console.log('discovering='+adapter.discovering);
    if (adapter.discovering =='true')
      app.discovering = true;
    else
      app.discovering = false;
    console.log('discovering='+app.discovering);
/*    chrome.bluetooth.getDevices(function(devices) {
      for (var idevice in devices) {
        device = devices[idevice];
        console.log('address='+device.address);
        console.log('deviceId='+device.name);
        console.log('connected='+device.connected);
        console.log('uuids='+device.uuids);
      }
    });*/
  });
    $('#detailPage').hide();
},
bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    $('#refreshButton').click(this.refreshDeviceList);
    $('#closeButton').click(this.refreshDeviceList);
},

refreshDeviceList: function() {
  console.log('refreshDeviceList');
    $('#deviceUUID').html(TITLE);
    $("#deviceList").hide();
    $("#notfound").show();
    devices = []; // empties the list
    chrome.bluetooth.onDeviceAdded.addListener(function(device) { 
      app.onDiscoverDevice(device);});  //ChromeBook
    chrome.bluetooth.onDeviceChanged.addListener(function(device) {
      app.onDiscoverDevice(device);});
    chrome.bluetooth.onDeviceRemoved.addListener(function(device) {  // Appears to never trigger
//console.log('Remove='+device.name);
      for( i=devices.length-1; i>=0; i--) {
        if( devices[i].address == device.address) {
          devices.splice(i,1);
        }
      }
    });
    app.showMainPage();
    app.disconnect();
    app.startDiscovery();  
},

onDiscoverDevice: function(device) {
    for (i=0; i<device.uuids.length; i++)  {
      if (device.uuids[i] == RFDUINO_SERVICE_UUID) {
        $("#notfound").hide();
        $("#deviceList").show();

       for( j=devices.length-1; j>=0; j--) {   //Remove previous device with same uuid then add updated one
          if( devices[j].address == device.address) {
            devices.splice(j,1);
          }
        }
        deviceList.innerHTML = '';
        devices.push (device);
        devices = devices.sort(app.sortFunction); 
        for (var idevice in devices) {
          var listItem = document.createElement('li');
          listItem.onclick = app.connect;
          var html = '<b>' + devices[idevice].name +'</b>';
          listItem.setAttribute('uuid', devices[idevice].address);
          listItem.innerHTML = html;
          deviceList.appendChild(listItem);
        }
      }
    }
},

sortFunction: function(a, b) {
                           return (b.inquiryRssi - a.inquiryRssi);
},
  
connect: function(e) {
    app.stopDiscovery(); //ChromeBook
    app.uuid = this.getAttribute('uuid');
    app.name = this.innerHTML;
    app.data= undefined;
    app.disConnectCmd= undefined;

    $('#deviceUUID').html("Connecting");
    data0.innerHTML = "";
    data1.innerHTML = "";
    data2.innerHTML = "";
    data3.innerHTML = "";
    chrome.bluetoothLowEnergy.connect(app.uuid, app.getConnection);
},

getConnection: function () {
    if (chrome.runtime.lastError) {
      console.log('Failed to connect: ' + chrome.runtime.lastError.message);
      chrome.bluetoothLowEnergy.connect(app.uuid, app.getConnection);
       //Hack to deal with connections not showing up right away
      return;
    }

    chrome.bluetoothLowEnergy.getServices(app.uuid, app.getCharacteristics);
},

getCharacteristics: function(services) {
      if (services.length === 0) {  //Another Hack to deal with services not showing up right away
//console.log('services.length === 0 -- uuid='+app.uuid);
        chrome.bluetoothLowEnergy.getServices(app.uuid, app.getCharacteristics);
        return;
      }
     
      for (var i = 0; i < services.length; i++) {
        if (services[i].uuid == RFDUINO_SERVICE_UUID) {
          app.service = services[i];
          break;
        }
      }
      if (app.service === undefined) return;

    if (chrome.runtime.lastError) {
      console.log('Fubar: ' + chrome.runtime.lastError.message);
      app.refreshDeviceList();
      return;
    }
    app.showDetailPage();
    chrome.bluetoothLowEnergy.getCharacteristics(app.service.instanceId,
                                             function(characteristics) {
    if (chrome.runtime.lastError) {
      console.log('Failed characteristics: ' + chrome.runtime.lastError.message);
      app.refreshDeviceList();
      return;
    }
      for (var i = 0; i < characteristics.length; i++) {
        if (characteristics[i].uuid == DISCONNECT_CHARACTERISTIC_UUID) 
          app.disConnectCmd = characteristics[i];
        if (characteristics[i].uuid == RECEIVE_CHARACTERISTIC_UUID) 
          app.data = characteristics[i];
      }

      chrome.bluetoothLowEnergy.startCharacteristicNotifications((app.data).instanceId,
        function() {
          if (chrome.runtime.lastError) {
            console.log('Failed to enable notifications: ' +
                  chrome.runtime.lastError.message + ' dataId=' + app.data.uuid);
            app.refreshDeviceList();
            return;
          }

    $('#deviceUUID').html(app.name);
        chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(
          function(chrc) {
            if (chrc.uuid != app.data.uuid)  return;
           app.onData (chrc.value);
          }); 
        });
      });
    },

onData: function(data) {
    var a = app.eight2sixteen(data);
    if      (a[0] < 1024) {data0.innerHTML = a[0]/10;}
    else if (a[0] < 2048) {data1.innerHTML = (a[0]-1024);}
    else if (a[0] < 3072) {data2.innerHTML = Math.max(0,Math.round((a[0]-2048-soilZero)/soilSlope));}
    else                  {data3.innerHTML = Math.max(0,Math.round((a[0]-3072-lightZero)/lightSlope*10)/10);}
},

disconnect: function() {
    if (app.disConnectCmd === undefined) return;
    console.log('Disconnecting=' + app.uuid);
    deviceUUID.innerHTML = "Water Tracker";
    app.stopNotification();
    chrome.bluetoothLowEnergy.writeCharacteristicValue(app.disConnectCmd.instanceId,
                                                   (new Uint8Array([])).buffer,
                                                   function() {
      if (chrome.runtime.lastError) {
        console.log('Failed to write value: ' + chrome.runtime.lastError.message);
        return;
      }
      app.disConnectCmd = undefined;
    });
          chrome.bluetoothLowEnergy.disconnect(app.uuid, function() {
            console.log('Disconnecting');
            if (chrome.runtime.lastError) {
              console.log('Disconnect: ' +
                  chrome.runtime.lastError.message);
            }
            app.service = undefined;
         });
},

startDiscovery: function() {
  if (app.discovering) return;
  app.discovering = true;
  chrome.bluetooth.startDiscovery(function() {console.log('Discover');});
},

stopDiscovery: function() {
  if (!app.discovering) return;
  app.discovering = false;
  chrome.bluetooth.stopDiscovery(function() {console.log('Stop Discovery');});
},

stopNotification: function() {
  if (app.data !== undefined)
       chrome.bluetoothLowEnergy.stopCharacteristicNotifications(app.data.instanceId,
        function() {
          if (chrome.runtime.lastError) {
            console.log('Failed to disable notifications: ' +
                  chrome.runtime.lastError.message);
          }
          app.data = undefined;
        });
},

showMainPage: function() {
    $('#detailPage').hide();
    $('#mainPage').show();
},

showDetailPage: function() {
    $('#mainPage').hide();
    $('#detailPage').show();
},

eight2sixteen: function (data){  //ChromeOS does not seem to suport uint16Array
  a = new Uint8Array(data);
  b=[];
  for (i=0; i<a.length; i+=2)  b.push((a[i+1]*256)+a[i]);
  return b;
},

}; 
window.onload = function() { //ChromeBook
  chrome.runtime.onSuspend.addListener(function() {app.disconnect();});
  app.showMainPage();
  app.initialize();
  app.refreshDeviceList();
};


