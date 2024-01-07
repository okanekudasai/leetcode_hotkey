var link = window.location.href.split("?code=");
let code;
if (link[1] != undefined) {
    chrome.storage.local.set({ "code": link[1] });
    code = link[1];
}

let token;
let username;
getUserName = () => {
    const headers = new Headers();
    headers.append('Authorization', `token ${token}`);
    fetch('https://api.github.com/user', {
        method: 'GET',
        headers: headers,
    }).then(res => res.json()).then(data => {
        console.log("*", data);
        chrome.storage.local.set({"token": token});
        chrome.storage.local.set({"username": JSON.stringify(username)});
        //창닫기
        chrome.runtime.sendMessage({ action: 'closeCurrentTab' });
    })
}
getToken = () => {
    fetch("http://localhost:8080/codeToToken/" + code).then(res => res.text()).then(data => {
        if (data != "error") {
            token = data
            getUserName();
        } else {
            alert("로그인 실패");
        }
    })
}
getToken();


// 창닫기