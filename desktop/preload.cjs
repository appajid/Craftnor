const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('craftnorProjects',{
 detach:()=>ipcRenderer.send('craftnor:project-detached'),
 save:(contents,saveAs)=>ipcRenderer.invoke('craftnor:save-project',{contents,saveAs:!!saveAs}),
 setDirty:dirty=>ipcRenderer.send('craftnor:dirty',!!dirty),
 onCommand(callback){const listener=async(_event,{id,action})=>{let ok=false;try{ok=!!(await callback(action));}finally{ipcRenderer.send('craftnor:command-result',{id,ok});}};ipcRenderer.on('craftnor:command',listener);return()=>ipcRenderer.removeListener('craftnor:command',listener);},
 onOpen(callback){const listener=async(_event,project)=>{if(await callback(project))ipcRenderer.send('craftnor:project-loaded',project.nativePath);};ipcRenderer.on('craftnor:open-project',listener);ipcRenderer.send('craftnor:projects-ready');return()=>ipcRenderer.removeListener('craftnor:open-project',listener);}
});
