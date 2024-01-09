init = () => {
    let link = window.location.href.split("?code=");
    let code = link[1];

    chrome.runtime.sendMessage({ action: 'closeCurrentTab', data: code });
}

init();
