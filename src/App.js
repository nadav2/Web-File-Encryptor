import React, {useEffect, useState} from "react";
import {FileUploader} from "react-drag-drop-files";
import { sha256 } from 'js-sha256';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './top_bar.css'
const CryptoJS = require("crypto-js");
const isMobile = require('is-mobile');


export default function App(){
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState(null);
    const [a1, setA1] = useState("files")
    const [a2, setA2] = useState("messages")
    const [current, setCurrent] = useState("files")
    const [chipper, setChipper] = useState("")
    const [editText, setEditText] = useState(<textarea style={{fontSize: "15px"}}  id={"textarea"} rows={7} cols={55} name="description" defaultValue={""} />)
    const [toastLocation, setToastLocation] = useState("bottom-right")


    const handleChange = (file) => {
        setFile(file);
        setFileName(file.name);
    }


    const [filesOrMessages, setFilesOrMessages] = useState(
        <div className={'drag_drop'}>
            <FileUploader maxSize={50} handleChange={handleChange} multiple={false} hoverTitle={"Drop your files here"} name="file" />
            <p className={"file_name"}>{fileName}</p>
        </div>
    )

    const splitter = "^^^@@###^^^$"

    const notify1 = () => toast.error("Incorrect Password");
    const notify2 = () => toast.error("The file is not encrypted");
    const notify3 = () => toast.error("The file is already encrypted");
    const notify4 = () => toast.info("The text has been added to your clipboard");
    const notify5 = () => toast.error("You did not select a file");
    const notify6 = () => toast.error("You didn't enter a password");
    const notify7 = () => toast.error("Please fill in all the required fields");


    useEffect(() => {
        const url = window.location.href
        const path = url.split("/").at(-1)

        if (path === "#messages"){
            setA1("")
            setA2("active")

            setCurrent("messages")

            setFilesOrMessages(
                <div className={'message'}>

                    <h3 className={'info_text'}>Enter a message that you wont to encrypt or an encrypted message</h3>

                    {editText}

                    <br />

                </div>
            )


        }
        else {
            setA1("active")
            setA2("")

            setCurrent("files")

            setFilesOrMessages( <div className={'drag_drop'}>
                <FileUploader maxSize={50} handleChange={handleChange} multiple={false} hoverTitle={"Drop your files here"} name="file" />
                <p  className={"file_name"}>{fileName}</p>
            </div>)

            setChipper("")

        }


    }, [current, editText, fileName])

    useEffect(() => {
        console.log(isMobile())
        if (isMobile.isMobile()){
            setEditText(<textarea style={{fontSize: "15px"}}  id={"textarea"} rows={7} cols={36} name="description" defaultValue={""} />)

            setToastLocation("top-left")
        }

    }, [])



    function encrypt(data_to_encrypt, key){
        return CryptoJS.AES.encrypt(data_to_encrypt, key).toString();
    }

    function decrypt(encrypted_data, key){
        try {
            return CryptoJS.AES.decrypt(encrypted_data, key).toString(CryptoJS.enc.Utf8);
        } catch (e) {
            notify1()
            return ""
        }
    }

    function save(filename, data) {
        const blob = new Blob([data], {type: '*/*'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }


    function encrypt_file(){
        const password = document.getElementById('password').value

        if (current === "files"){
            const read = new FileReader();

            if (file != null){
                if (password === ""){
                    notify6()
                }
                else {
                    read.readAsArrayBuffer(file);

                    read.onloadend = function(){
                        const content = read.result;

                        const read1 = new FileReader();
                        read1.readAsBinaryString(file);
                        read1.onloadend = function(){
                            const contents = (read1.result).split(splitter);

                            if (contents.length === 3){
                                notify3()
                            }
                            else{
                                const b64 = arrayBufferToBase64(content)
                                const enc = encrypt(b64, password)

                                save(fileName + "_enc", enc + splitter + fileName + splitter + sha256(password))
                            }
                        }
                    }
                }
            }

            else{
                notify5()
            }
        }
        else{
            const txt = document.getElementById("textarea").value
            const enc = encrypt(txt, password)

            if (txt === ""){
                notify7()
            }
            else if (password === ""){
                notify6()
            }
            else{
                setChipper(enc)

                copyTextToClipboard(enc)
                notify4()
            }


        }

    }


    function decrypt_file(){
        const password = document.getElementById('password').value

        if (current === "files"){
            const read = new FileReader();

            if (file != null){
                read.readAsBinaryString(file);

                read.onloadend = function(){
                    const contents = (read.result).split(splitter);

                    if (contents.length === 3){
                        if (sha256(password) === contents[2]){
                            const dec = decrypt(contents[0], password)

                            save(contents[1], base64ToArrayBuffer(dec))
                        } else{
                            notify1()
                        }
                    }else{
                        notify2()
                    }
                }
            }

            else{
                notify5()
            }

        } else{
            const txt = document.getElementById("textarea").value
            const dec = decrypt(txt, password)

            if (txt === ""){
                notify7()
            }
            else if (password === ""){
                notify6()
            }

            else{
                if (dec === "") {
                    notify1()
                }
                else{
                    setChipper(dec)
                    console.log(dec)

                    copyTextToClipboard(dec)
                    notify4()
                }
            }


        }
    }



    function arrayBufferToBase64( buffer ) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }


    function base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function open() {
        const win = window.open("https://www.eshqol.com/", '_blank');
        if (win != null) {
            win.focus();
        }
    }


    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }


    function copyTextToClipboard(text) {
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }



    return (
        <div className={"app"}>

            <div className="topnav">
                <a className={a1}  href={"#files"} onClick={() => setCurrent("files")}>Files</a>
                <a className={a2}  href={"#messages"} onClick={() => setCurrent("messages")}>Messages</a>

                <a onClick={open}>Our Other Apps</a>
            </div>


            <div>
                <h1 className={"title"}>Eshqol Encryptor</h1>
                <hr className={"line"}/>
            </div>


            <input id={"password"} className={'input'} onFocus={window.blur} placeholder={'Type your password'} />


            <div className={"encrypt"}>
                <button className={"button-30"} onClick={encrypt_file}>Encrypt</button>
            </div>

            <div className={"decrypt"}>
                <button className={"button-30"} onClick={decrypt_file}>Decrypt</button>
            </div>

            <p className={"chipper"}>{chipper}</p>

            {filesOrMessages}

            <div className={'toast'}>
                <ToastContainer

                    position={toastLocation}
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover

                    bodyClassName="toastBody"
                />
            </div>

        </div>

    )





}

