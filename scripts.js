import merge from "./node_modules/lodash-es/merge.js"
let output_content;

function upload_files() {
    const file1 = document.getElementById("file1").files[0]
    const file2 = document.getElementById("file2").files[0]

    if (!file1 || !file2) {
        alert("Please select both files.")
        return
    }

    file1.text().then((PromiseResult) => {
        let file_1_content = PromiseResult
        document.getElementById("file1Content").textContent = file_1_content
        file2.text().then((PromiseResult) => {
            let file_2_content = PromiseResult
            document.getElementById("file2Content").textContent = file_2_content
            output_content = merger(file_1_content, file_2_content)
            document.getElementById("outputContent").innerText = output_content
        })
    })
}

function lua_to_json(input) {
    let str = input
    let diff;
    do {  // replace curlies around arrays with square brackets
        diff = str.length;
        str = str.replace(/\{(((\n\t*)\t)\S.*(\2.*)*)\,\s--\s\[\d+\]\3\}/g,'[$1$3]');
        diff = diff - str.length;
    } while (diff > 0);
    str = str
        .replace(/GatherItems\s=\s/, '')                                            // remove variable definition
        .replace(/.*(?<=(Gatherer_SavedSettings_AccountWide))[\s\S]*/, '')          // remove account specific settings
        .replace(/\[([0-9]*)\]/g, '"$1"')                                           // Wrap numeric keys in "" instead of []
        .replace(/\s--\s\[\d+\](\n)/g, '$1')                                        // remove comment
        .replace(/\,(\n\t*\})/g, '$1')                                              // remove trailing comma
        .replace(/\[(.*?)\]\s\=\s/g,'$1:')                                          // change equal to colon, remove brackets
        //.replace(/[\t\r\n]/g,'')                                                    // remove tabs & returns
        .replace(/(".)=(.{)/g, '$1:$2')                                             // catch remaining equals and replace with colon    
        .replace(/,(\s*})/g, '$1');                                                    // remove remaining trailing commas
    //console.log(str)
    let json = JSON.parse(str)
    return json
}

function json_to_lua(input) {
    let str = input
    //console.log(str)
    str = str
        .replace(/("([0-9]*)"|("[a-z-\s-']*"))\s*:/g, '[$2$3] =')
    return str
}

function merger(master, mergee) {
    let lua1 = master
    let lua2 = mergee
    let acc_settings = lua1.replace(/[\s\S]*(?=(Gatherer_SavedSettings_AccountWide))/,'')
    let temp = json_to_lua(JSON.stringify(merge(lua_to_json(lua1), lua_to_json(lua2)), null, 4))
    //output_file = new File([output], "Gatherer.lua",{type: "text/plain"})
    return "GatherItems = " + temp + "\n" + acc_settings
}

function download_file(filename){
    if(!output_content){
        alert("No files merged")
        return
    }
    
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output_content));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
}

document.getElementById("download-file").addEventListener("click", () => (download_file("Gatherer.lua"), false))
document.getElementById("upload-files").addEventListener("click", () => {upload_files(), false})