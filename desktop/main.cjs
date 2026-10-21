const { app, BrowserWindow, Menu, dialog, protocol, session, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { resolveAsset } = require('./paths.cjs');
const {projectPaths,readProject,writeProject}=require('./projects.cjs');
let projectsReady=false,pendingProjects=[],openingProject=false,currentProjectPath=null,documentDirty=false,allowClose=false,closingPrompt=false,savingProject=false,quitting=false;
const pendingOpenedPaths=new Set();const pendingCommands=new Map();let commandId=0;
function trusted(event){return event.sender===mainWindow?.webContents&&event.senderFrame===mainWindow.webContents.mainFrame&&event.sender.getURL().startsWith(APP_URL);}
function command(action){if(!mainWindow||!projectsReady)return Promise.resolve(false);const id=++commandId;return new Promise(resolve=>{const timer=setTimeout(()=>{pendingCommands.delete(id);resolve(false);},900000);pendingCommands.set(id,ok=>{clearTimeout(timer);resolve(ok);});mainWindow.webContents.send('craftnor:command',{id,action});});}

async function flushProjects(){if(!projectsReady||!mainWindow||openingProject)return;openingProject=true;try{while(pendingProjects.length){const file=pendingProjects.shift();try{const project=await readProject(file);if(mainWindow&&!mainWindow.isDestroyed()){pendingOpenedPaths.add(file);mainWindow.webContents.send('craftnor:open-project',{...project,nativePath:file});}}catch(error){dialog.showErrorBox('Project could not open',error.message);}}}finally{openingProject=false;}}
function queueProjects(files){pendingProjects.push(...files);if(app.isReady()){if(!mainWindow)openWindow();else{mainWindow.show();mainWindow.focus();}void flushProjects();}}
app.on('open-file',(event,file)=>{event.preventDefault();queueProjects([file]);});
const APP_URL = 'craftnor://studio/';
protocol.registerSchemesAsPrivileged([{ scheme: 'craftnor', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.wasm':'application/wasm', '.json':'application/json', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.woff2':'font/woff2', '.png':'image/png', '.ico':'image/x-icon' };
const csp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' blob: data:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'";
let mainWindow, aboutWindow;
function openAbout(){if(aboutWindow){aboutWindow.focus();return;}aboutWindow=new BrowserWindow({title:"About Craftnor",width:880,height:850,minWidth:360,minHeight:500,backgroundColor:"#f8f9fc",autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});aboutWindow.webContents.setWindowOpenHandler(({url})=>url.startsWith(APP_URL)&&(/\/credits\//.test(url)||url.endsWith("HarfBuzz-LICENSE"))?{action:"allow",overrideBrowserWindowOptions:{width:800,height:650,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}}}:{action:"deny"});aboutWindow.webContents.on("will-navigate",(event,url)=>{if(!url.startsWith(APP_URL))event.preventDefault();});aboutWindow.loadURL(APP_URL+"?about=1");aboutWindow.on("closed",()=>{aboutWindow=null;});}
function openWindow() {
  projectsReady=false;
  mainWindow = new BrowserWindow({ title:'Craftnor', width:1440, height:940, minWidth:380, minHeight:620, backgroundColor:'#f3f4ee', show:false, autoHideMenuBar:process.platform!=='darwin', webPreferences:{ preload:path.join(__dirname,'preload.cjs'), nodeIntegration:false, contextIsolation:true, sandbox:true, webSecurity:true }, icon:path.join(app.getAppPath(),'dist','branding','app-icon-192.png') });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({url}) => url.startsWith(APP_URL)&&(/\/credits\//.test(url)||url.endsWith('HarfBuzz-LICENSE'))?{action:'allow',overrideBrowserWindowOptions:{width:800,height:650,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}}}:{action:'deny'});
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(APP_URL)) event.preventDefault(); });
  mainWindow.webContents.on('will-redirect', (event, url) => { if (!url.startsWith(APP_URL)) event.preventDefault(); });
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => { if(code!==-3) dialog.showErrorBox('Craftnor could not open', description); });
  mainWindow.webContents.on('will-prevent-unload',event=>{if(allowClose){event.preventDefault();return;}const response=dialog.showMessageBoxSync(mainWindow,{type:'warning',message:'Leave without saving your changes?',detail:'Unsaved changes will be lost.',buttons:['Discard Changes','Cancel'],defaultId:1,cancelId:1,noLink:true});if(response===0)event.preventDefault();});
  mainWindow.loadURL(APP_URL);
  mainWindow.on('close',event=>{if(allowClose||!documentDirty)return;event.preventDefault();if(closingPrompt)return;closingPrompt=true;void(async()=>{try{const {response}=await dialog.showMessageBox(mainWindow,{type:'warning',title:'Unsaved Craftnor project',message:'Save your changes before closing?',detail:'Your changes will be lost if you quit without saving.',buttons:['Save','Quit Without Saving','Cancel'],defaultId:0,cancelId:2,noLink:true});if(response===2){quitting=false;return;}if(response===0&&!(await command('save'))){quitting=false;return;}allowClose=true;if(quitting)app.quit();else mainWindow.close();}finally{closingPrompt=false;}})();});
  mainWindow.on('closed', () => { mainWindow=null;documentDirty=false;allowClose=false;currentProjectPath=null;for(const resolve of pendingCommands.values())resolve(false);pendingCommands.clear(); });
}
app.on('before-quit',()=>{quitting=true;});
if(!app.requestSingleInstanceLock()) app.quit();
else {
 app.on('second-instance', (_event,argv) => { queueProjects(projectPaths(argv)); if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.focus();} });
 app.whenReady().then(() => {
  ipcMain.on('craftnor:project-detached',event=>{if(trusted(event)){currentProjectPath=null;mainWindow.setRepresentedFilename('');}});
  ipcMain.on('craftnor:dirty',(event,dirty)=>{if(trusted(event)){documentDirty=!!dirty;mainWindow.setDocumentEdited(documentDirty);}});
  ipcMain.on('craftnor:project-loaded',(event,file)=>{if(trusted(event)&&pendingOpenedPaths.has(file)){pendingOpenedPaths.delete(file);currentProjectPath=file.toLowerCase().endsWith('.cfnr')?file:null;if(currentProjectPath)mainWindow.setRepresentedFilename(currentProjectPath);}});
  ipcMain.on('craftnor:command-result',(event,result)=>{if(!trusted(event)||typeof result?.id!=='number')return;const resolve=pendingCommands.get(result.id);if(resolve){pendingCommands.delete(result.id);resolve(!!result.ok);}});
  ipcMain.handle('craftnor:save-project',async(event,{contents,saveAs}={})=>{if(!trusted(event)||savingProject)return{saved:false};savingProject=true;try{let file=saveAs?null:currentProjectPath;if(!file){const result=await dialog.showSaveDialog(mainWindow,{title:'Save Craftnor project',defaultPath:currentProjectPath||path.join(app.getPath('documents'),'Untitled.cfnr'),filters:[{name:'Craftnor Project',extensions:['cfnr']}],properties:['createDirectory','showOverwriteConfirmation']});if(result.canceled||!result.filePath)return{saved:false};file=result.filePath;if(!file.toLowerCase().endsWith('.cfnr'))file+='.cfnr';}else{try{await fs.access(file);const result=await dialog.showMessageBox(mainWindow,{type:'question',message:'Replace “'+path.basename(file)+'”?',detail:'The existing project will be overwritten with your current changes.',buttons:['Overwrite','Cancel'],defaultId:1,cancelId:1,noLink:true});if(result.response!==0)return{saved:false};}catch(error){if(error.code!=='ENOENT')throw error;}}const result=await writeProject(file,contents);currentProjectPath=file;mainWindow.setRepresentedFilename(file);return{saved:true,...result};}catch(error){return{saved:false,error:error.message};}finally{savingProject=false;}});
  ipcMain.on('craftnor:projects-ready',event=>{if(event.sender===mainWindow?.webContents&&event.senderFrame===mainWindow.webContents.mainFrame&&event.sender.getURL().startsWith(APP_URL)){projectsReady=true;void flushProjects();}});
  const root=path.join(app.getAppPath(),'dist');
  protocol.handle('craftnor', async request => {
    try { const file=resolveAsset(root,request.url);const data=await fs.readFile(file);return new Response(data,{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}}); }
    catch { return new Response('Not found',{status:404}); }
  });
  session.defaultSession.setPermissionCheckHandler((contents, permission) => permission==='local-fonts' && !!contents?.getURL().startsWith(APP_URL));
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => callback(permission==='local-fonts' && contents.getURL().startsWith(APP_URL)));
  session.defaultSession.on('will-download', (_event,item,contents) => {
    if(!contents?.getURL().startsWith(APP_URL)){item.cancel();return;}
    item.setSaveDialogOptions({title:'Save Craftnor artwork',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});
    item.once('done',(_event,state)=>{if(state==='interrupted')dialog.showErrorBox('Export could not be saved','Please export again and choose another location.');});
  });
  const menu=[...(process.platform==='darwin'?[{label:'Craftnor',submenu:[{label:'About Craftnor',click:openAbout},{type:'separator'},{role:'services'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]}]:[]),{label:'File',submenu:[{label:'Open Project…',accelerator:'CmdOrCtrl+O',click:async()=>{const result=await dialog.showOpenDialog(mainWindow,{title:'Open Craftnor project',properties:['openFile'],filters:[{name:'Craftnor projects',extensions:['cfnr','json']}]});if(!result.canceled)queueProjects(result.filePaths);}},{label:'Save Project',accelerator:'CmdOrCtrl+S',click:()=>void command('save')},{label:'Save Project As…',accelerator:'CmdOrCtrl+Shift+S',click:()=>void command('saveAs')},{type:'separator'},{role:'close'}]},{label:'Edit',submenu:[{label:'Undo',accelerator:'CmdOrCtrl+Z',click:()=>void command('undo')},{label:'Redo',accelerator:'CmdOrCtrl+Shift+Z',click:()=>void command('redo')},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{role:'viewMenu'},{role:'windowMenu'},{label:'Help',submenu:[{label:'About Craftnor & Credits',click:openAbout}]}];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  app.setAboutPanelOptions({applicationName:'Craftnor',applicationVersion:app.getVersion(),copyright:'© 2026 Appaji Ambarisha Darbha',credits:'Created by Appaji Ambarisha Darbha. Brand artwork adapted from the supplied SVG kit.'});
  pendingProjects.push(...projectPaths(process.argv));
  openWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)openWindow();});
 });
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
