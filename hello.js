document.addEventListener('DOMContentLoaded', () => {
    var current_hot_key = document.getElementById('current_hot_key');
    var change_button = document.getElementById('change_button');
    var check_button = document.getElementById('check_button');
    var retry_button = document.getElementById('retry_button');
    var cancel_button = document.getElementById('cancel_button');
    var state_complete = document.getElementById('state_complete');
    var state_change = document.getElementById('state_change');
    var change_state = false;
    var hot_key_to_set = [];
    var init = () => {
        chrome.storage.local.get("hot_key", function (result) {
            current_hot_key.innerText = result["hot_key"];
        });
    }
    var clear_hot_key_to_set = () => {
        hot_key_to_set.length = 0;
        current_hot_key.innerText = " "
    }
    init();
    change_button.addEventListener('click', () => {
        toggle_button_show_hide();
        clear_hot_key_to_set();
        change_state = true;
    });
    check_button.addEventListener('click', () => {
        toggle_button_show_hide();
        let setObj = {};
        setObj['hot_key'] = hot_key_to_set.join("+");
        chrome.storage.local.set(setObj);
        change_state = false;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // 현재 활성화된 탭에 메시지 전송
            chrome.tabs.sendMessage(tabs[0].id, { action: 'callContentScriptFunction' });
        });
    });
    retry_button.addEventListener('click', () => {
        clear_hot_key_to_set();
    })
    cancel_button.addEventListener('click', () => {
        toggle_button_show_hide();
        init();
        change_state = false;
    })
    toggle_button_show_hide = () => {
        change_button.classList.toggle('hide');
        check_button.classList.toggle('hide');
        retry_button.classList.toggle('hide');
        cancel_button.classList.toggle('hide');
        state_complete.classList.toggle('hide');
        state_change.classList.toggle('hide');
        current_hot_key.classList.toggle('blinking');
    }
    document.addEventListener("keydown", (e) => {
        if (!change_state) return;
        if (hot_key_to_set.includes(e.code)) {
            let elementToRemove = e.code; // 제거할 요소 값
            let indexToRemove = hot_key_to_set.indexOf(elementToRemove);
            hot_key_to_set.splice(indexToRemove, 1);
        } else {
            hot_key_to_set.push(e.code);
        }
        current_hot_key.innerText = hot_key_to_set.join(" + ");
    })
})