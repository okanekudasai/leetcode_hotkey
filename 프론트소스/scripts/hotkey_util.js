
var hot_key = "";
chrome.storage.local.get("hot_key", (result) => {
    hot_key = result["hot_key"].split("+");
})

/** 현재 키보드에 눌려진 키를 담는 배열이에요 */
let pressed_key = [];
document.addEventListener('keydown', (event) => {

    // 눌린 키를 배열에 담아요
    pressed_key.push(event.code)

    // 핫키 배열을 돌며 하나라도 눌린키에 안들어 있다면 동작을 중지해요 
    let flag = true;

    if (hot_key != undefined && hot_key.length > 0) {
        for (let i of hot_key) {
            if (!pressed_key.includes(i)) {
                flag = false;
                break;
            }
        }
    }

    // 모든 키가 눌렸다면 각 content script에 run_button_click을 작동시켜요
    if (hot_key.length > 0 && flag) {

        // 깃 푸쉬 진행 과정을 보여주기 위한 새로운 요소를 문서에 추가해줘요
        let notice_position_box = document.createElement('div');
        let notice_content_box = document.createElement('div');
        let instruction_box = document.createElement('div');

        notice_position_box.classList.add("git_process_bar_position_box");
        notice_position_box.classList.add("hide");
        notice_content_box.classList.add("notice_content_box");
        notice_content_box.classList.add("flex_center");
        instruction_box.classList.add("instruction_box");

        document.body.appendChild(notice_position_box);
        notice_position_box.appendChild(notice_content_box);
        notice_content_box.appendChild(instruction_box);

        instruction_box.innerText = "실행 단축키가 눌렸어요"
        notice_position_box.classList.remove("hide");

        setTimeout(() => {
            notice_position_box.classList.add("show_git_process");
            setTimeout(() => {
                notice_position_box.classList.remove("show_git_process");
                setTimeout(() => {
                    notice_position_box.classList.add("hide");
                }, 500)
            }, 2000)
        }, 5);

        try {
            run_button_click();
        } catch (error) {
            console.log("단축키를 지원하지 않는 사이트", error);
        }
    }
})

// 키가 떼지면 pressed_key에서 제거해요
document.addEventListener('keyup', function (event) {
    let elementToRemove = event.code; // 제거할 요소 값
    let indexToRemove = pressed_key.indexOf(elementToRemove);

    if (indexToRemove !== -1) {
        pressed_key.splice(indexToRemove, 1);
    }
})

