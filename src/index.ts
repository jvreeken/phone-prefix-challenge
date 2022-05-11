/*
  ___   _____.__                                      __   
 / /  _/ ____\__| ____   ________  _  __ ____   _____/  |_ 
 \ \  \   __\|  |/    \ /  ___/\ \/ \/ // __ \_/ __ \   __\
 < <   |  |  |  |   |  \\___ \  \     /\  ___/\  ___/|  |  
 / /   |__|  |__|___|  /____  >  \/\_/  \___  >\___  >__|  
 \_\_                \/     \/              \/     \/      

 */
window.Webflow || (window.Webflow = []);
window.Webflow.push(() => {
    //Add meta tag to fix mobile issue of autozoom when input is focused in iOS Safari (This doesn't effect zooming just a workaround to remove the ugly autozoom)
    var meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
    document.getElementsByTagName('head')[0].appendChild(meta);
    //Focus the phone number input by default (works for desktop only. iOS safari requires user interaction first)
    document.getElementById('phoneNumber').autofocus = true;
    $('#phoneNumber').focus();
    //Turn on caching for certain requests
    $.ajaxPrefilter(function (options) {
        if (options.type === 'GET' && options.dataType === 'script') {
            options.cache = true;
        }
    });
    $.getScript("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js", function (data, textStatus, jqxhr) {
        if (textStatus === "success") {
            var flagsAPI = "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags";
            //Default Country Data
            var ccID = "US";
            var ccName = "United States";
            //Detect Country Code (This would go into its own service in prod with the api key hidden using something like vercel and next.js but just for the sake of a quick demo)
            var request = new XMLHttpRequest();
            request.open('GET', 'https://api.ipdata.co/?api-key=870e4fa099675bdb626a8de9fc6991ab2edfc533c956fba18244f390');
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
                    //Move the autodetected country to be the first option in the select
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
                    //Initialize select2 and customize the look and feel (replacing the webflow dropdown but keeping the styles from it)
                    $('#HIDE-WF-DROPDOWN').addClass('hidden');
                    $('.phone-prefix-select2').select2({
                        data: results,
                        templateResult: template,
                        templateSelection: function (data, container) {
                            var ccCode = data.idd.root;
                            if (data.idd.suffixes.length === 1) {
                                ccCode = ccCode.concat(data.idd.suffixes[0]);
                            }
                            $('[name="countryCode"]').val(ccCode);
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
                    //Auto focus search input when clicking the select2 dropdown
                    $('.select2-container').click(function (e) {
                        $(e.currentTarget).prev('select').data('select2').$dropdown.find('.select2-search__field').focus();
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