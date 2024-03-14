import * as jose from "https://cdnjs.cloudflare.com/ajax/libs/jose/5.2.3/index.js";

waitForElement('.nav-sections[data-section-status="loaded"]').then((elm) => {
    var signoutButton = document.querySelector('li > a[title="Sign out"]');
    var loginButton = document.querySelector('li > a[title="Login"]');
    var cookieName = "polaris-delivery-token";
    var comingSoonPlaceHolder = window.location.origin + "/resources/summit/coming-soon.jpeg";
    var errorLoadingPlaceHolder = window.location.origin + "/resources/summit/loading.jpeg";

    // JWT related variables
    var securedImages = [];
    var secretKey = "cm-p129624-e1269699";
    var JWTexpiry = "2024-05-26T20:28:33.213+05:30";
    var roles = "admin";

    function logOutUser() {
        document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.querySelector("input[name='uname']").value = '';
        document.querySelector("input[name='psw']").value = '';
        toggleLoginButtons();
        updateUserName();
        updateImageLinks();
    }

    function logInUser() {
        generateJwtAndUpdateDOM();
    }

    function isLoggedIn() {
        return document.cookie.indexOf(cookieName) != -1;
    }

    function toggleLoginButtons() {
        if(isLoggedIn()) {
            // user is logged in
            loginButton.closest("li").setAttribute("hidden", "");
            signoutButton.parentElement.removeAttribute("hidden", "");
        } else {
            // user is anonymous
            loginButton.closest("li").removeAttribute("hidden", "");
            signoutButton.parentElement.setAttribute("hidden", "");
        }
    }

    function styleUpTheLimitedEdition() {
        var limitedEdition = Array.from(document.querySelectorAll("li")).filter((el) => el.innerHTML.indexOf("Limited") != -1)[0];
        limitedEdition.style.color= "red";
        limitedEdition.style.fontWeight = "bold";
        limitedEdition.addEventListener("click", (event) => {
            window.location.href = "/furniture-street#limited-editions";
        });
    }

    function appendLoginForm() {
        var loginMarkup = '<div class="login-form">' +
                            '<form action="action_page.php" method="post">' +
                                '<div class="container">' +
                                    '<div class="user-input">' +
                                        '<label for="uname"><b>Username</b></label>' +
                                        '<input type="text" placeholder="Enter Username" name="uname" required>' +
                                        '<label for="psw"><b>Password</b></label>' +
                                        '<input type="password" placeholder="Enter Password" name="psw" required>' +
                                    '</div>' +    
                                    '<button class="login-button" type="submit">Login</button>' +
                                    '<br>' +
                                    '<label>' +
                                        '<input type="checkbox" checked="checked" name="remember"> Remember me' +
                                    '</label>' +
                                '</div>' +
                            '</form>' + 
                        '</div>';                     
        loginButton.parentElement.innerHTML = loginMarkup;
        loginButton = document.querySelector('.login-button');
    }

    function addEventListeners() {
        signoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            logOutUser();
        });
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            logInUser();
        });
        document.querySelector(".user-input").addEventListener("click", (event) => {
            document.querySelector('.user-input').closest(".nav-drop").click();
        });
    }

    function updateUserName() {
        var userIconEle = loginButton.closest("ul").parentElement;
        var username = "User\n";
        if (isLoggedIn()) {
            username = document.querySelector("input[name='uname']").value || "User";
            userIconEle.childNodes[1].textContent = "Hey " + username + "!\n";
        } else {
            userIconEle.childNodes[1].textContent = username + "\n";
        }
    }

    // ToDo : this part need to be udpated with decorator
    function updateImageLinks() {
        securedImages.forEach((img) => {
            if(isLoggedIn()) {
                var srcUrl = img.parentElement.getAttribute("data-original-source");
                fetch(srcUrl, {
                    headers: {
                        'x-asset-delivery-token' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6ImFkbWluIiwiZXhwaXJ5IjoiMjAyNC0wNS0yNlQyMDoyODozMy4yMTMrMDU6MzAifQ.pPevSmHnWup_t7IQgYDRsPHBhAjTdLLz02g9nt9ul1A'
                    }
                }).then(resp => resp.blob())
                .then(blob => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Data = reader.result;
                            img.setAttribute("src" , base64Data);
                            img.parentElement.querySelectorAll("source").forEach((el) => {
                                el.setAttribute("srcset", base64Data);
                            });
                        };
                        reader.readAsDataURL(blob);
                });
                if (img.width == 0 || img.src == comingSoonPlaceHolder) {
                    img.setAttribute("src" , errorLoadingPlaceHolder);
                    img.parentElement.querySelectorAll("source").forEach((el) => {
                        el.setAttribute("srcset", errorLoadingPlaceHolder);
                    });
                }
            } else {
                img.setAttribute("src" , comingSoonPlaceHolder);
                img.parentElement.querySelectorAll("source").forEach((el) => {
                    el.setAttribute("srcset", comingSoonPlaceHolder);
                });
            }
        });
    }

    function matchesPolarisDeliveryUrl(srcUrl) {
        // code to match regex for host matching "delivery-pxxxx-exxxx" and URI starts with either adobe/assets/deliver or adobe/dynamicmedia/deliver
        const regex = /^(https?:\/\/delivery-p[0-9]+-e[0-9-cmstg]+\.adobeaemcloud\.com\/(adobe\/assets\/deliver|adobe\/dynamicmedia\/deliver)\/(.*))/gm;
        return srcUrl.match(regex) != null;
    }

    // ToDo : this part need to be udpated with decorator
    function identifySecuredImages() {
        document.querySelectorAll("img[loading='eager']").forEach((img) => {
            //if(!img.getAttribute("width") && matchesPolarisDeliveryUrl(img.getAttribute("src"))) {
            if(img.getAttribute('src').includes(comingSoonPlaceHolder))
            {
                securedImages.push(img);
                var srcUrl = img.getAttribute("src");
                if(img.parentElement.getAttribute('data-original-source') == null)
                img.parentElement.setAttribute("data-original-source", srcUrl);
            }
        });
        console.log("Total secured images found : " + securedImages.length);
        var securedHost = new URL(document.querySelector("picture[data-original-source]:not([data-original-source=''])").getAttribute("data-original-source")).host;
        secretKey = securedHost.replace("delivery", "cm").replace("-cmstg.adobeaemcloud.com", "").replace(".adobeaemcloud.com", "");
    }

    function generateJwtAndUpdateDOM() {
        // Define the secret key
        const secret = new TextEncoder().encode(secretKey);
    
        // Define the JWT header
        const header = {
            "alg": "HS256",
            "typ": "JWT"
        };
    
        // Define the JWT claims
        const jwtClaims = {
            "roles": roles,
            "expiry": JWTexpiry
        };
 
        new jose.SignJWT(jwtClaims)
            .setProtectedHeader(header)
            .sign(secret)
            .then((token) => {
                document.cookie = cookieName + "=" + token + "; expires=Thu, 01 Jan 2970 00:00:00 UTC; path=/;";
                toggleLoginButtons();
                updateUserName();
                updateImageLinks();
                console.log('JWT generated successfully : ' + token);
            });
    }

    function init() {
        styleUpTheLimitedEdition();
        appendLoginForm();
        toggleLoginButtons();
        addEventListeners();
        updateUserName();
        identifySecuredImages();
        
        // Call the function to generate the JWT
        if(isLoggedIn()) generateJwtAndUpdateDOM();
        updateImageLinks();
    }

    init();

});


function waitForElement(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // Observe changes in the entire document body (including subtree)
        observer.observe(document.body, { childList: true, subtree: true });
    });
}