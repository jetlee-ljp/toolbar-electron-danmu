const { app, BrowserWindow, ipcMain } = require('electron')
const electron = require('electron');
const path = require('path')
var screenElectron = electron.screen;
const mqtt = require('mqtt')


/**
 * 全局定义
 */
// 订阅消息
let MqttClient;

// 屏幕可用宽高
let ScrAllWidth;
let ScrAllHeight;

let mainWindow;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 350,
        skipTaskbar: true,
        maximizable: false,
        autoHideMenuBar: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, '/browserWindows/js/mainc.js')
        }
    })
    ipcMain.on('startDanMuConfig', (event, data) => {
        if (data == 0) {
            MqttClient.end()

        }
        else {
            var roomId = data.roomId;
            var isNickName = data.isNickName;
            startMqtt(roomId, isNickName);
        }

    });

    mainWindow.loadFile("./browserWindows/html/main.html")
    mainWindow.on("closed", function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    createWindow()
    // 获取主屏幕数据
    let mainScreen = screenElectron.getPrimaryDisplay();
    // var allScreens = screenElectron.getAllDisplays();
    // 获取可用高
    ScrAllHeight = mainScreen.workArea.height;
    ScrAllWidth = mainScreen.workArea.width;
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})


/**
 *  弹幕子窗体方法及参数
 */
let subWindowsArr = [];
let IntervalArr = [];
let PositionArr = [];
function addSubWindows(content) {
    let dateStr = Date.now();
    let subWidth = content.length * 50;
    let topPos = Math.floor(Math.random() * (ScrAllHeight-50))
    subWindowsArr[dateStr] = new BrowserWindow({
        width: subWidth,
        height: 50,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        maximizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, '/browserWindows/js/danmu.js')
        }
    })
    PositionArr[dateStr] = ScrAllWidth;
    IntervalArr[dateStr] = setInterval(() => {
        PositionArr[dateStr]--;
        subWindowsArr[dateStr].setPosition(PositionArr[dateStr], topPos, true)
        if (PositionArr[dateStr] + subWidth < 0) {
            subWindowsArr[dateStr].close();
            clearInterval(IntervalArr[dateStr])
        }
    }, 10);
    subWindowsArr[dateStr].loadFile("./browserWindows/html/danmu.html")
    subWindowsArr[dateStr].webContents.send('setValue', content);
}



function startMqtt(roomId, isNickName) {
    const host = '101.35.188.99'
    const port = '1883'
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
    const connectUrl = `mqtt://${host}:${port}`

    MqttClient = mqtt.connect(connectUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        username: 'danmu',
        password: 'danmu',
        reconnectPeriod: 1000,
    })
    MqttClient.on('connect', () => {
        // console.log('Connected')
        MqttClient.subscribe([roomId], () => {
            // console.log(`Subscribe to topic '${roomId}'`)
        })
    })
    MqttClient.on('message', (roomId, payload) => {
        var data = JSON.parse(payload);
        // console.log('Received Message:', roomId, payload.toString())
        var contentStr = "";
        // console.log(isNickName)
        if (isNickName == "true") {
            contentStr = data.nickName.toString() + " : " + data.message.toString()
        }
        else {
            contentStr = data.message.toString()
        }
        addSubWindows(contentStr)
    })


}




