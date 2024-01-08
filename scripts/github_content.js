
init = () => {
    let link = window.location.href.split("?code=");
    let code = link[1];
    
    if (code == undefined) {
        return;
    }

    chrome.runtime.sendMessage({ action: 'closeCurrentTab', data: code });
}

init();
