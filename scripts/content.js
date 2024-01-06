let submit_list
let find_try = 0;
let find_submit_list = setInterval(() => {
    submit_list = document.querySelector("#qd-content").firstChild.firstChild.firstChild.firstChild.firstChild.nextElementSibling.firstChild.firstChild.nextElementSibling;
    find_try++;
    if (submit_list != null) {
        clearInterval(find_submit_list);
        
        // 제출 리스트를 찾으면 아래 코드실행
        var parentElement = submit_list;

        // Mutation Observer 생성
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // mutation.type이 'childList'이면 자식 노드가 변경된 것
                if (mutation.type === 'childList') {
                    after_find_new_submit(mutation);
                }
            });
        });

        // Mutation Observer 설정
        var observerConfig = { childList: true };

        // Mutation Observer 시작
        observer.observe(parentElement, observerConfig);

        // 예제로 사용할 함수
        after_find_new_submit = (e) => {
            let result = e.addedNodes[0].firstChild.firstChild.firstChild.firstChild.firstChild.innerText;
            console.log(result);
            if (result == "Accepted") {
                alert("통과");
            }
        }
    }
    if (find_try >= 10) {
        clearInterval(find_submit_list);
        console.log("못찾음");
    }
}, 1000)

let hot_key = [];
init = () => {
    chrome.storage.local.get("hot_key", function (result) {
        hot_key = result["hot_key"].split("+");
    });
}
init();

let pressed_key = [];
document.addEventListener('keydown', function (event) {
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
document.addEventListener('keyup', function (event) {
    let elementToRemove = event.code; // 제거할 요소 값
    let indexToRemove = pressed_key.indexOf(elementToRemove);

    if (indexToRemove !== -1) {
        pressed_key.splice(indexToRemove, 1);
    }
})