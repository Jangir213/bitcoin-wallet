

$(document).ready(function () {
    
    var client = {};
    var currentRare = 0;
    var val = '';
    var address = '';
    var SATOSHIS = 100000000;
    var FEE = SATOSHIS * .0001;
    var BTCUnits = 'BTC';
    var BTCMultiplier = SATOSHIS;
    var wallet = {};
    


        
    /*
    *  Authorization
    */

    function auth() {
        var attempt = 3; 
        var login = $('#login').value;
        var password = $('#password').value;
        if (Bitcoin.getAccount({ username: login, password: password})) {
            client = new Client({ username: login, password: password});
            wallet = client.getwallet();
        } else {
            attempt--;
            if (attempt == 0) {
                document.getElementById("login").disabled = true;
                document.getElementById("password").disabled = true;
                document.getElementById("submit").disabled = true;
                return false;
            }
        }
    }




    /*
    *  Get Rate
    */
    function getCurrentRate () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.fxclub.org/markets/crypto/bitcoin/', true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {

                var textPage = xhr.responseText;
                var parser = new DOMParser();
                var page = parser.parseFromString(textPage, "text/html");
                var rate = page.querySelector('.fxc-instrument-rate').innerText;
                currentRare = parseInt(rate);
            }
        }
    }

    /*
    * Set Currency Rate
    */
    $('#setCurrency').click(function () {
        getCurrentRate();
        var currencies = rate;
        var tableBody = '';
        for (var i = 0; i < currencies.length / 3; i++) {
            tableBody += '<tr>';
            for (var j = i; j <= i + 12; j += 6) {
                tableBody += '<td><div class="radio no-padding"><label><input type="radio" name="' + currencies[j] + '"';
                if (currencies[j] === currency) {
                    tableBody += ' checked';
                }
                tableBody += '>' + currencies[j] + '</label></div></td>';
            }
            tableBody += '</tr>';
        }
        $('#tableBody').html(tableBody);
        $('#setCurrencyModal').modal().show();
        $('.radio').click(function () {
            var currency = $.trim($(this).text());
            $('input:radio[name=' + currency + ']').attr('checked', 'checked');
            preferences.setCurrency(currency).then(function () {
                $('#amountLabel').text('Amount:');
                $('#successAlertLabel').text('Currency set to ' + currency + '.');
                $('#successAlert').show();
                $('#setCurrencyModal').modal('hide');
            });
        });
    });


    /*
     *  Send BTC
     */
    $('#sendButton').click(function () {
        val = Math.floor(Number($('#amount').val() * BTCMultiplier));
        address = $('#sendAddress').val();
        var balance = wallet.getBalance();
        var validAmount = true;
        if (val <= 0) {
            validAmount = false;
        } else if (val + FEE > balance) {
            validAmount = false;
        }
        if (validAmount) {
            $('#amountAlert').slideUp();
        } else {
            $('#amountAlert').slideDown();
        }

        var regex = /^[13][1-9A-HJ-NP-Za-km-z]{26,33}$/;
        var validAddress = true;
        if (!regex.test(String(address))) {
            validAddress = false;
        } else {
            try {
                new Bitcoin.Address(address);
            } catch (e) {
                validAddress = false;
            }
        }

        if (validAddress) {
            $('#addressAlert').slideUp();
        } else {
            $('#addressAlert').slideDown();
        }

        if (validAddress && validAmount) {
            if (wallet.isEncrypted()) {
                currencyManager.formatAmount(val).then(function (formattedMoney) {
                    var text = 'Are you sure you want to send<br />' + val / BTCMultiplier + ' ' + BTCUnits + ' (<strong>' + formattedMoney + '</strong>)<br />to ' + address + ' ?';
                    $('#sendConfirmationText').html(text);
                    $('#sendConfirmationPassword').val(null);
                    $('#sendConfirmationPasswordIncorrect').hide();
                    $('#sendConfirmationModal').modal().show();
                });
                confirmSend();
            }
        }
    });


    function confirmSend() {
        $('#cover').show();
        var toAddress = $('#sendConfirmationTo').val();
        wallet.send(address, val, FEE, toAddress).then(function () {
            $('#amount').val(null);
            $('#sendAddress').val(null);
            $('#amountLabel').text('Amount:');
            var text = 'Sent ' + val / BTCMultiplier + ' ' + BTCUnits + ' to ' + address + '.';
            $('#successAlertLabel').text(text);
            $('#successAlert').slideDown();
            $('#sendConfirmationModal').modal('hide');
            $('#cover').fadeOut('slow');
        }, function (e) {
            if (wallet.isEncrypted()) {
                $('#sendConfirmationPasswordIncorrect').text(e.message).slideDown();
            } else {
                $('#unknownErrorAlertLabel').text(e.message);
                $('#unknownErrorAlert').slideDown();
            }
            $('#cover').hide();
        });
    }

    /*
    *  Generate New Wallet
    */
    $('#generateNewWallet').click(function () {
        $('#generateNewWalletPasswordIncorrect').hide();
        if (wallet.isEncrypted()) {
            $('#generateNewWalletPassword').show().val(null);
        } else {
            $('#generateNewWalletPassword').hide();
        }
        $('#generateNewWalletModal').modal().show();
    });

    $('#generateNewWalletConfirm').click(function () {
        wallet.generateAddress($('#generateNewWalletPassword').val()).then(function () {
            setupWallet();
            $('#successAlertLabel').text('New wallet generated.');
            $('#successAlert').show();
            $('#generateNewWalletModal').modal('hide');
        }, function () {
            $('#generateNewWalletPasswordIncorrect').slideDown();
        });
    });



    /*
     * Get All List 
     */
    $('#setUnits').click(function () {
        wallet.getAllAddress().then(function (units) {
            var availableUnits = ['BTC', 'mBTC', 'µBTC'];
            var tableBody = '<tr>';
            for (var i = 0; i < availableUnits.length; i++) {
                tableBody += '<td><div class="radio no-padding"><label><input type="radio" name="' + availableUnits[i] + '"';
                if (availableUnits[i] === units) {
                    tableBody += ' done';
                }
                tableBody += '>' + availableUnits[i] + '</label></div></td>';
            }
            tableBody += '</tr>';
            $('#tableBody').html(tableBody);
            $('#setCurrencyModal').modal().show();
            $('.radio').click(function () {
                var units = $.trim($(this).text());
                $('input:radio[name=' + units + ']').attr('checked', 'checked');
                setBTCUnits(units);
                preferences.setBTCUnits(units).then(function () {
                    $('#successAlertLabel').text('Units set to ' + units + '.');
                    $('#successAlert').show();
                    $('#setCurrencyModal').modal('hide');
                });
            });
        });
    });

    /*
     *  Show Private Key
     */
    $('#showPrivateKey').click(function () {
        $('#showPrivateKeyPasswordIncorrect').hide();
        if (wallet.isEncrypted()) {
            $('#showPrivateKeyPassword').val(null).show();
        } else {
            $('#showPrivateKeyPassword').hide();
        }
        $('#privateKey').hide();
        $('#showPrivateKeyModal').modal().show();
    });

    $('#showPrivateKeyConfirm').click(function () {
        var password = $('#showPrivateKeyPassword').val();
        if (wallet.isEncrypted() && !wallet.validatePassword(password)) {
            $('#showPrivateKeyPasswordIncorrect').slideDown();
        } else {
            $('#showPrivateKeyPasswordIncorrect').slideUp();
            var privateKey = wallet.getDecryptedPrivateKey(password);
            $('#privateKeyQRCode').html(createQRCodeCanvas(privateKey));
            $('#privateKeyText').text(privateKey);
            $('#privateKey').slideDown(function () {
                $('#main').height($('#showPrivateKeyModal').find('.modal-dialog').height());
            });
        }
    });

    /*
     *  Import Private Key
     */
    $('#importPrivateKey').click(function () {
        $('#importPrivateKeyPasswordIncorrect').hide();
        $('#importPrivateKeyBadPrivateKey').hide();
        if (wallet.isEncrypted()) {
            $('#importPrivateKeyPassword').val(null).show();
        } else {
            $('#importPrivateKeyPassword').hide();
        }
        $('#importPrivateKeyPrivateKey').val(null);
        $('#importPrivateKeyModal').modal().show();
    });

    $('#importPrivateKeyConfirm').click(function () {
        var privateKey = $('#importPrivateKeyPrivateKey').val();
        try {
            new Bitcoin.ECKey(privateKey).getExportedPrivateKey();
        } catch (e) {
            $('#importPrivateKeyBadPrivateKey').slideDown();
            return;
        }
        wallet.importAddress($('#importPrivateKeyPassword').val(), privateKey).then(function () {
            setupWallet();
            $('#successAlertLabel').text('Private key imported successfully.');
            $('#successAlert').show();
            $('#importPrivateKeyModal').modal('hide');
        }, function (e) {
            if (e.message === 'Incorrect password') {
                $('#importPrivateKeyBadPrivateKey').slideUp();
                $('#importPrivateKeyPasswordIncorrect').slideDown();
            } else {
                $('#importPrivateKeyPasswordIncorrect').slideUp();
                $('#importPrivateKeyBadPrivateKey').slideDown();
            }
        });
    });

    


    /*
     * Resizing
     */

    $('.modal').on('shown.bs.modal', function() {
        var $main = $('#main');
        var height = $main.height();
        var modalHeight = $(this).find('.modal-dialog').height();
        if (modalHeight > height) {
            $main.height(modalHeight);
            if (typeof chrome === 'undefined') {
                addon.port.emit('resize', modalHeight+2);
            }
        }
    }).on('hidden.bs.modal', function () {
        $('#main').height('auto');
        if (typeof chrome === 'undefined') {
            if ($('#successAlert').is(':visible')) {
                var height = 350;
            } else {
                var height = 278;
            }
            addon.port.emit('resize', height);
        }
    });

    function createQRCodeCanvas(text) {
        var sizeMultiplier = 4;
        var typeNumber;
        var lengthCalculation = text.length * 8 + 12;
        if (lengthCalculation < 72) { typeNumber = 1; }
        else if (lengthCalculation < 128) { typeNumber = 2; }
        else if (lengthCalculation < 208) { typeNumber = 3; }
        else if (lengthCalculation < 288) { typeNumber = 4; }
        else if (lengthCalculation < 368) { typeNumber = 5; }
        else if (lengthCalculation < 480) { typeNumber = 6; }
        else if (lengthCalculation < 528) { typeNumber = 7; }
        else if (lengthCalculation < 688) { typeNumber = 8; }
        else if (lengthCalculation < 800) { typeNumber = 9; }
        else if (lengthCalculation < 976) { typeNumber = 10; }
        var qrcode = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
        qrcode.addData(text);
        qrcode.make();
        var width = qrcode.getModuleCount() * sizeMultiplier;
        var height = qrcode.getModuleCount() * sizeMultiplier;
        // create canvas element
        var canvas = document.createElement('canvas');
        var scale = 10.0;
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        // compute tileW/tileH based on width/height
        var tileW = width / qrcode.getModuleCount();
        var tileH = height / qrcode.getModuleCount();
        // draw in the canvas
        for (var row = 0; row < qrcode.getModuleCount(); row++) {
            for (var col = 0; col < qrcode.getModuleCount(); col++) {
                ctx.fillStyle = qrcode.isDark(row, col) ? "#000000" : "#ffffff";
                ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
            }
        }
        return canvas;
    }


    wallet.setBalanceListener(function (balance) {
        setBalance(balance);
    });
    setupWallet();

    $('#amount').on('keyup change', function () {
        val = Math.floor(Number($(this).val() * BTCMultiplier));
        if (val > 0) {
            currencyManager.formatAmount(val).then(function (formattedMoney) {
                var text = 'Amount: ' + formattedMoney;
                $('#amountLabel').text(text);
            });
        } else {
            $('#amountLabel').text('Amount:');
        }
    });

    function setBTCUnits(units) {
        BTCUnits = units;
        if (units === 'µBTC') {
            BTCMultiplier = SATOSHIS / 1000000;
        } else if (units === 'mBTC') {
            BTCMultiplier = SATOSHIS / 1000;
        } else {
            BTCMultiplier = SATOSHIS;
        }

        setBalance(wallet.getBalance());
        $('#sendUnit').html(BTCUnits);
        $('#amount').attr('placeholder', '(Plus ' + FEE / BTCMultiplier + ' ' + BTCUnits + ' fee)').attr('step', 100000 / BTCMultiplier).val(null);
        $('#amountLabel').text('Amount:');
    }
    preferences.getBTCUnits().then(setBTCUnits);

    function setBalance(balance) {
        if (Number(balance) < 0 || isNaN(balance)) {
            balance = 0;
        }
        $('#balance').text(balance / BTCMultiplier + ' ' + BTCUnits);
    }

    $('#successAlertClose').click(function () {
        $('#successAlert').fadeOut();
        if (typeof chrome === 'undefined') {
            addon.port.emit('resize', 278);
        }
    });

    $('#unkownErrorAlertClose').click(function () {
        $('#unknownErrorAlert').fadeOut();
    });

    if (typeof chrome === 'undefined') {
        addon.port.on('show', setupWallet);
    }

    /*
     * Set Password
     */
    $('#setPassword').click(function () {
        $('#passwordMismatch').hide();
        $('#setPasswordIncorrect').hide();
        $('#setPasswordBlank').hide();
        if (wallet.isEncrypted()) {
            $('#removePasswordDiv').show();
            $('#setPasswordPassword').show().val(null);
        } else {
            $('#removePasswordDiv').hide();
            $('#setPasswordPassword').hide().val(null);
        }
        $('#newPassword').show().val(null);
        $('#confirmNewPassword').show().val(null);
        $('#removePassword').attr('checked', false);
        $('#setPasswordModal').modal().show();
    });

    $('#removePassword').click(function () {
        if (this.checked) {
            $('#newPassword').val(null).slideUp();
            $('#confirmNewPassword').val(null).slideUp();
        } else {
            $('#newPassword').slideDown();
            $('#confirmNewPassword').slideDown();
        }
    });


    $('#confirmSendButton').click(function () {
        confirmSend();
    });

    $('#confirmSetPassword').click(function () {
        var password = $('#setPasswordPassword').val(),
            newPassword = $('#newPassword').val(),
            confirmNewPassword = $('#confirmNewPassword').val();
        var validInput = true;
        if ((wallet.isEncrypted() && !password) || (!$('#removePassword').is(':checked') && (!newPassword || !confirmNewPassword))) {
            validInput = false;
            $('#setPasswordBlank').slideDown();
        } else {
            $('#setPasswordBlank').slideUp();
        }

        if (validInput && newPassword !== confirmNewPassword) {
            validInput = false;
            $('#passwordMismatch').slideDown();
        } else {
            $('#passwordMismatch').slideUp();
        }

        if (validInput && wallet.isEncrypted() && !wallet.validatePassword(password)) {
            validInput = false;
            $('#setPasswordIncorrect').slideDown();
        } else {
            $('#setPasswordIncorrect').slideUp();
        }

        if (validInput) {
            wallet.updatePassword(String(password), String(newPassword)).then(function () {
                $('#successAlertLabel').text('New password set.');
                $('#successAlert').show();
                $('#setPasswordModal').modal('hide');
            });
        }

    });

});