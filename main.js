console.log("iskopower - načteno");
let currentUrl = location.href;

let keys = [];

// Prvotní inicializace / reset
function firstInit() {
    chrome.storage.sync.get(['keys', 'colorCheckbox', 'discoColor', 'colorPicker', 'picturesCheckbox', 'firstSetup'], function (result) {

        if (result.keys === undefined || result.keys.length === 0) {
            let defaultKeys = ["ZEMAN", "SBOR", "KOMENSKY"];
            chrome.storage.sync.set({keys: defaultKeys}, function () {
                console.log('iskopower - Nebyly nalezeny žádné klíče, nastaveny výchozí klíče');
            });
        }
        if (result.firstSetup === undefined || result.firstSetup === false) {
            chrome.storage.sync.set({
                colorCheckbox: true,
                discoColor: true,
                colorPicker: "#4caf50",
                picturesCheckbox: true,
                firstSetup: true
            }, function () {
                console.log('iskopower - Nebyly nalezeny žádné nastavení, nastaveny výchozí nastavení');
            });
        }
    });
}

firstInit();


// Hlavní funkce
chrome.storage.sync.get(['keys', 'colorCheckbox', 'discoColor', 'colorPicker', 'picturesCheckbox', 'firstSetup'], function (result) {
    // Nastavení klíčů, podle těch, které byly uloženy
    keys = result.keys;
    // Kontrola, jestli je člověk v nastavení
    if (currentUrl == "https://is.ghrabuvka.cz/profile") {
        setTimeout(() => {
            loadSettings();
        }, 250);
    }

    setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            if (currentUrl == "https://is.ghrabuvka.cz/profile") {
                setTimeout(() => {
                    loadSettings();
                }, 250);
            }
        }
    }, 100);


    // Načtení nastavení
    function loadSettings() {
        // Přidání nastavení do profilu uživatele
        const moduleProfile = document.querySelector('#module_profile');
        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = `<div id="iskopower-settings">
    <h1 class="varColor">Nastavení doplňku iskopower <span class="material-icons" title="Tento doplněk je produktem třetí strany a nemá nic společného se samotným informačním systémem. Některá nastavení potřebují obnovení stránky pro aplikování.">info</span></h1>
    <div class="left">
    <div class="form-group"><label for="colorCheckbox">Povolit barvy</label><input type="checkbox" name="colorCheckbox" id="colorCheckbox"></div>
    <div class="form-group"><label for="discoColor">Disco mód</label><input type="checkbox" name="discoColor" id="discoColor"></div>
    <div class="form-group"><label for="colorPicker">Výběr barvy</label><input type="color" name="colorPicker" id="colorPicker"></div>
    <div class="form-group"><label for="picturesCheckbox">Povolit fotky</label><input type="checkbox" name="picturesCheckbox" id="picturesCheckbox"></div>
    <div class="form-group"><label for="key">Zadejte klíč</label><input type="text" name="key" id="key"></div>
    <div class="form-group"><button id="verifyKey" class="btn varBg">Ověřit klíč</button></div></div>
    </div>`;
        moduleProfile.appendChild(settingsDiv);


        // Nastavení checkboxů
        const colorCheckbox = document.getElementById('colorCheckbox');
        const discoColor = document.getElementById('discoColor');
        const colorPicker = document.getElementById('colorPicker');
        const picturesCheckbox = document.getElementById('picturesCheckbox');
        const keyInput = document.getElementById('key');
        const verifyKey = document.getElementById('verifyKey');

        colorCheckbox.checked = result.colorCheckbox;
        discoColor.checked = result.discoColor;
        colorPicker.value = result.colorPicker;
        picturesCheckbox.checked = result.picturesCheckbox;

        if (!result.colorCheckbox) {
            discoColor.disabled = true;
            colorPicker.disabled = true;
        }

        colorCheckbox.addEventListener('input', (event) => {
            if (!event.target.checked) {
                discoColor.disabled = true;
                colorPicker.disabled = true;
            } else {
                discoColor.disabled = false;
                colorPicker.disabled = false;
            }
            chrome.storage.sync.set({colorCheckbox: event.target.checked}, function () {
                console.log('iskopower - Nastavení povolení barvy bylo uloženo');
            });
        });


        discoColor.addEventListener('input', (event) => {
            chrome.storage.sync.set({discoColor: event.target.checked}, function () {
                console.log('iskopower - Nastavení disco módu bylo uloženo');
            });
        });
        let lastColorPickerUpdate = 0;

        colorPicker.addEventListener('input', (event) => {
            if (Date.now() - lastColorPickerUpdate > 100) {
                chrome.storage.sync.set({colorPicker: event.target.value}, function () {
                    console.log('iskopower - Nastavení barvy bylo uloženo');
                });
                lastColorPickerUpdate = Date.now();
            }
        });

        picturesCheckbox.addEventListener('input', (event) => {
            chrome.storage.sync.set({picturesCheckbox: event.target.checked}, function () {
                console.log('iskopower - Nastavení povolení fotek bylo uloženo');
            });
        });

        // Ověření klíče
        verifyKey.addEventListener('click', (event) => {
            axios({
                method: 'get',
                url: `https://pocketbase.thevelda.eu/api/collections/pictures/records/?key=${keyInput.value}`,
            }).then(function (response) {
                let data = response.data.items[0]
                if (!data) {
                    alert('Neplatný klíč');
                    return;
                }
                let picture = {
                    name: data.name,
                    imageSrc: `https://pocketbase.thevelda.eu/api/files/${data.collectionId}/${data.id}/${data.image}`,
                    style: {
                        top: data.top,
                        left: data.left,
                        height: data.height
                    },
                    color: data.color
                }
                if (result.keys.includes(keyInput.value)) {
                    alert('Tento klíč jsi již našel.');
                    return;
                }
                alert('Klíč si napsal správně!\nNázev obrázku: ' + picture.name);
                result.keys.push(keyInput.value);
                chrome.storage.sync.set({keys: result.keys}, function () {
                });

                // Přidávání nalezeného klíče do seznamu
                let pictureSettingDiv = document.createElement('div');
                pictureSettingDiv.id = key;
                pictureSettingDiv.innerHTML = `<div class="imageWrapper"><img src="${picture.imageSrc}" alt="${picture.name}" class="studentImage">
        <i class="material-icons">delete</i>
        <i class="material-icons" style="top: 30px">info</i>
        </div></div></div>`;
                selectStudents.appendChild(pictureSettingDiv);
                pictureSettingDiv.querySelector('div > i:nth-child(2)').addEventListener('click', (event) => {
                    if (confirm(`Opravdku chceš odstranit obrázek ${picture.name}, který má klíč: ${picture.key}?`)) {
                        let index = result.keys.indexOf(key);
                        if (index > -1) {
                            result.keys.splice(index, 1);
                        }
                        chrome.storage.sync.set({keys: result.keys}, function () {
                        });
                        pictureSettingDiv.remove();
                    }
                });
                pictureSettingDiv.querySelector('div > i:nth-child(3)').addEventListener('click', (event) => {
                    alert(`Název: ${picture.name}\nBarva: ${picture.color}\nKlíč: ${picture.key}`);
                });
            });
        });


        const settingsPicturesDiv = document.createElement('div');
        settingsPicturesDiv.innerHTML = '<div id="iskopower-pictures"><h1 class="varColor">Obrázky doplňku iskopower <span class="material-icons" title="Tento doplněk je produktem třetí strany a nemá nic společného se samotným informačním systémem.">info</span></h1><div id="selectStudents"></div></div>';

        moduleProfile.appendChild(settingsPicturesDiv);
        const selectStudents = document.querySelector("#iskopower-pictures > div")

        // Přidávnaí nalezených klíčů
        if (!result.keys) return;
        keys.forEach(key => {
            axios({
                method: 'get',
                url: `https://pocketbase.thevelda.eu/api/collections/pictures/records/?key=${key}`,
            }).then(function (response) {
                let data = response.data.items[0]
                if (!data) return false;
                let picture = {
                    name: data.name,
                    key: data.key,
                    imageSrc: `https://pocketbase.thevelda.eu/api/files/${data.collectionId}/${data.id}/${data.image}`,
                    style: {
                        top: data.top,
                        left: data.left,
                        height: data.height
                    },
                    color: data.color
                }
                let pictureSettingDiv = document.createElement('div');
                pictureSettingDiv.id = key;
                pictureSettingDiv.innerHTML = `<div class="imageWrapper"><img src="${picture.imageSrc}" alt="${picture.name}" class="studentImage">
        <i class="material-icons">delete</i>
        <i class="material-icons" style="top: 30px">info</i>
        </div></div></div>`;
                selectStudents.appendChild(pictureSettingDiv);
                pictureSettingDiv.querySelector('div > i:nth-child(2)').addEventListener('click', (event) => {
                    if (confirm(`Opravdku chceš odstranit obrázek ${picture.name}, který má klíč: ${picture.key}?`)) {
                        let index = result.keys.indexOf(key);
                        if (index > -1) {
                            result.keys.splice(index, 1);
                        }
                        chrome.storage.sync.set({keys: result.keys}, function () {
                        });
                        pictureSettingDiv.remove();
                    }
                });
                pictureSettingDiv.querySelector('div > i:nth-child(3)').addEventListener('click', (event) => {
                    alert(`Název: ${picture.name}\nBarva: ${picture.color}\nKlíč: ${picture.key}`);
                });
            });
        })
    }

    // Nastavení barvy
    if (result.colorCheckbox) {
        if (result.discoColor) {
            let hsla = 0;
            setInterval(() => {
                hsla = hsla + 1;
                document.querySelector("head > style").innerHTML = `.varColor { color: hsla(${hsla}, 100%, 20%, 1) !important; } .varBg { background: hsla(${hsla}, 100%, 20%, 1) !important; }`
            }, 5);
        } else {
            document.querySelector("head > style").innerHTML = `.varColor { color: ${result.colorPicker} !important; } .varBg { background: ${result.colorPicker} !important; }`
        }
    }


    if (result.picturesCheckbox) {
        // Výběr náhodného klíče
        const key = keys[Math.floor(Math.random() * keys.length)];

        // Nastavování obrázku
        axios({
            method: 'get',
            url: `https://pocketbase.thevelda.eu/api/collections/pictures/records/?key=${key}`,
        }).then(function (response) {
            let data = response.data.items[0]
            if (!data) return false;
            let picture = {
                name: data.name,
                imageSrc: `https://pocketbase.thevelda.eu/api/files/${data.collectionId}/${data.id}/${data.image}`, //TODO: Zrušit hardcoded db/api xd
                style: {
                    top: data.top,
                    left: data.left,
                    height: data.height
                },
                color: data.color
            }
            let img = document.querySelector("#studentImg");
            img.src = picture.imageSrc
            img.style.top = "calc(var(--top-slider) * 1px)";
            img.style.height = "calc(var(--height-slider) * 1px)";
            img.style.left = "calc(var(--left-slider) * 1px)";

            document.documentElement.style.setProperty('--top-slider', picture.style.top);
            document.documentElement.style.setProperty('--height-slider', picture.style.height);
            document.documentElement.style.setProperty('--left-slider', picture.style.left);
            if (!result.colorCheckbox) {
                document.querySelector("head > style").innerHTML = `.varColor { color: ${picture.color} !important; } .varBg { background: ${picture.color} !important; }`
            }
        });
    }
});

// Funkce pro debugování
function debugMode() {
// Pomocný element k umístění
    const helpElement = document.getElementById('studentFeedback');
// Vytvoření elementu pro zadání čísla
    const topInput = document.createElement('input');
    const heightInput = document.createElement('input');
    const leftInput = document.createElement('input');
    const srcInput = document.createElement('input');

// Nastavení atributů elementu
    topInput.type = 'number';
    topInput.step = '10';
    topInput.value = '300';
    topInput.id = 'top-slider';

    heightInput.type = 'number';
    heightInput.step = '10';
    heightInput.value = '300';
    heightInput.min = '0';
    heightInput.id = 'height-slider';

    leftInput.type = 'number';
    leftInput.step = '10';
    leftInput.value = '50';
    leftInput.id = 'left-slider';

    srcInput.type = 'text';
    srcInput.id = 'src-input';

// Přidání elementu do DOM
    helpElement.appendChild(document.createElement("br"));
    helpElement.appendChild(topInput);
    helpElement.appendChild(heightInput);
    helpElement.appendChild(leftInput);
    helpElement.appendChild(srcInput);


    const topSlider = document.getElementById('top-slider');
    const heightSlider = document.getElementById('height-slider');
    const leftSlider = document.getElementById('left-slider');
    const srcSlider = document.getElementById('src-input');


//Vytvoření labelů
    const topLabel = document.createElement('span');
    const heightLabel = document.createElement('span');
    const leftLabel = document.createElement('span');
    const srcLabel = document.createElement('span');

// Nastavení popisků k debug inputům:"
    topLabel.textContent = 'Odsazení ze shora:';
    heightLabel.textContent = 'Velikost:';
    leftLabel.textContent = 'Odsazení z leva:';
    srcLabel.textContent = 'Odkaz:';

    topLabel.className = 'greyOption';
    heightLabel.className = 'greyOption';
    leftLabel.className = 'greyOption';
    srcLabel.className = 'greyOption';

    topSlider.parentNode.insertBefore(topLabel, topSlider);
    heightSlider.parentNode.insertBefore(heightLabel, heightSlider);
    leftSlider.parentNode.insertBefore(leftLabel, leftSlider);
    srcSlider.parentNode.insertBefore(srcLabel, srcSlider);

    topSlider.addEventListener('input', (event) => {
        document.documentElement.style.setProperty('--top-slider', event.target.value);
    });

    heightSlider.addEventListener('input', (event) => {
        document.documentElement.style.setProperty('--height-slider', event.target.value);
    });

    leftSlider.addEventListener('input', (event) => {
        document.documentElement.style.setProperty('--left-slider', event.target.value);
    });

    srcSlider.addEventListener('input', (event) => {
        document.querySelector("#studentImg").src = event.target.value;
    });

    let img = document.querySelector("#studentImg");
    img.style.top = "calc(var(--top-slider) * 1px)";
    img.style.height = "calc(var(--height-slider) * 1px)";
    img.style.left = "calc(var(--left-slider) * 1px)";
}