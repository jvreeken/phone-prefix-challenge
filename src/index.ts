// The looked down upon for some reason jQuery Way (I don't know typescript but I should learn)
window.Webflow || (window.Webflow = []);
window.Webflow.push(() => {
    //Focus the phone number input by default
    $('#phoneNumber').focus();
    $.getScript("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js", function (data, textStatus, jqxhr) {
        if (textStatus === "success") {
            var flagsAPI = "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags";
            //Default Country Data
            var ccID = "US";
            var ccName = "United States";
            //Detect Country Code (This would go into its own service in prod with the api key hidden using something like vercel and next.js but just for the sake of a quick demo)
            var request = new XMLHttpRequest();
            request.open('GET', 'https://api.ipdata.co/?api-key=test');
            request.setRequestHeader('Accept', 'application/json');
            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    ccID = JSON.parse(this.responseText)['country_code'];
                    ccName = JSON.parse(this.responseText)['country_name'];
                }
            };
            request.send();
            //Get Country Data
            $.ajax({
                url: flagsAPI,
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    //Make data in the correct format for select2
                    var results = $.map(data, function (obj) {
                        obj.text = obj.cca2 + '|' + obj.name.common;
                        obj.id = obj.cca2;
                        return obj;
                    });
                    var objToMove = "";
                    var objToMoveIdx = "";
                    results.some(function (elem, index) {
                        if ((elem.id === ccID) && (elem.name.common === ccName)) {
                            objToMoveIdx = index;
                            objToMove = elem;
                        }
                    });
                    results.splice(objToMoveIdx, 1);
                    results.unshift(objToMove);
                    //Template the select html
                    function template(cca2) {
                        if (!cca2.id) {
                            return cca2.text
                        }
                        var $cca2 = $('<span><img src="' + cca2.flags.svg + '" loading="lazy" data-element="flag" class="prefix-dropdown_flag" /><span class="cca2-text">' + cca2.id + '</span> <span class="cca2-separation">|</span> <span class="cca2-name-common">' + cca2.name.common + '</span></span>');
                        return $cca2;
                    };
                    //Initialize select2 and customize the look and feel
                    $('.phone-prefix-select2').select2({
                        data: results,
                        templateResult: template,
                        templateSelection: function (data, container) {
                            var ccCode = data.idd.root;
                            if (data.idd.suffixes.length === 1) {
                                ccCode = ccCode.concat(data.idd.suffixes[0]);
                            }
                            $('[name="countryCode"]').val(ccCode);
                            $('#HIDE-WF-DROPDOWN').addClass('hidden');
                            var $data = $('<span><img src="' + data.flags.svg + '" loading="lazy" data-element="flag" class="prefix-dropdown_flag" /> <span class="cc-code">' + ccCode + '</span></span>');
                            if (data.id === '') { // adjust for custom placeholder values
                                return 'begin typing to search';
                            }
                            return $data;
                        },
                        "language": {
                            "noResults": function () {
                                return '<span class="cca2-no-results-found">No Countries Found... Please try again.</span>';
                            }
                        },
                        escapeMarkup: function (markup) {
                            return markup;
                        }
                    });
                    //Placeholder for select2 search
                    $('#phone-prefix-select').one('select2:open', function (e) {
                        $('input.select2-search__field').prop('placeholder', ' Begin typing to search...');
                    });
                },
                //Catch any errors
                error: function (request, error) {
                    console.log("Request: " + JSON.stringify(request));
                }
            });
        }
    });
});