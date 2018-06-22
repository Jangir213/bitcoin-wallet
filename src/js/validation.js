var attempt = 3; 

document.addEventListener('load', function (e) {
    validate();
});

function validate() {
    var login = document.getElementById("login").value;
    var password = document.getElementById("password").value;
    if (login == "Formget" && password == "formget#123") {
        console.log("Login successfully");
        return false;
    }
    else {
        attempt--;
        if (attempt == 0) {
            document.getElementById("login").disabled = true;
            document.getElementById("password").disabled = true;
            document.getElementById("submit").disabled = true;
            return false;
        }
    }
}

