chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'callContentScriptFunction') {
        init();
    }
});

let hot_key = [];
init = () => {
    chrome.storage.local.get("hot_key", function (result) {
        hot_key = result["hot_key"].split("+");
    });
}
init();

let pressed_key = [];
document.addEventListener('keydown', function(event) {
    pressed_key.push(event.code)
    let flag = true;
    for (let i of hot_key) {
        if (!pressed_key.includes(i)) {
            flag = false;
            break;
        }
    }
    if (flag) {
        var leetcode_run = document.querySelector('[data-e2e-locator="console-run-button"]');
        if (leetcode_run != null) leetcode_run.click()
        var programeers_run = document.querySelector('#run-code')
        if (programeers_run != null) programeers_run.click()
    }
    // console.log(hot_key)
    // console.log(pressed_key)
})
document.addEventListener('keyup', function(event) {
    let elementToRemove = event.code; // 제거할 요소 값
    let indexToRemove = pressed_key.indexOf(elementToRemove);

    if (indexToRemove !== -1) {
        pressed_key.splice(indexToRemove, 1);
    }
})