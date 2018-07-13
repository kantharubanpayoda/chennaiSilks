$(function() {
    var statistics = [], graphEntries;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    var recentListMapper = {"supplier": "rejToSupplier", "designer": "overDue", "reviewer": "subToApprover"}
    // $(".month-dropdown .selected-month").text(months[getCurrentMonth()-1]);
    // for(var i=0; i < getCurrentMonth(); i++) {
    //     $(".month-dropdown .dropdown-menu").append("<li class='month-item'><a>" + months[i] + "</a></li>");
    // }

    //disable start date based on end date
    $('.to-selector').datepicker().on('changeDate', function(e) {
        $('.from-selector').datepicker('setEndDate', e.date);
        getFilteredStatus();        
    });

    //disable end date based on start date
    $('.from-selector').datepicker().on('changeDate', function(e) {        
        $('.to-selector').datepicker('setStartDate', e.date);
        getFilteredStatus();
    });

    //initialize dates
    var date = new Date();
    var today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var firstDayYear = new Date(date.getFullYear(), 0, 1);
    $('.to-selector').datepicker('setDate', today);
    $('.from-selector').datepicker('setDate', firstDay);
    $('.from-selector').datepicker('setStartDate', firstDayYear);
    

    //get statistics
    function getFilteredStatus() {
        var fromDate = $('.from-selector').datepicker('getDate').getTime();
        var toDate = $('.to-selector').datepicker('getDate').setHours(23, 59, 59, 999);
        getProfilePromise.then(function(response) { 
           
            if(fromDate && toDate) {
                $(".dashboard-wrap > .loading-icon").show();            
                var dashboardUrl = config.serverURL + config.getStatistics + "?from=" + fromDate + "&to=" + toDate;    
                getRequest(dashboardUrl,function(response){
                    
                    $(".dashboard-wrap > .loading-icon").hide();
                    if(response.error) {                    
                        $(".error-msg").text(response.error);
                    } else {
                        statistics = response.data;
                        showStatisticsData(response.data.filtered, getCurrentMonth());      
                        showStatisticsGraph(response.data.annual);
                    }
                }, function() {
                    $(".dashboard-wrap > .loading-icon").hide();
                    $(".error-msg").text(config.serverError);
                });
            }
        });
    };
    
    //get recent list or user count
    getProfilePromise.then(function(response) {
        $(".recent-list-wrap .loading-icon").show();
        console.log(response);
        if(response.data.roles[0] === "admin") {
            getUserStatistics(response);
           
            
        } else {
            getRecentProductList(response);            
        }
    }).catch(function(){

    });

    //get recent products based on role
    function getUserStatistics() {
        var getUserStatUrl = config.serverURL + config.getUserStatistics;   
        getRequest(getUserStatUrl, function(response) {
            $(".recent-list-wrap .loading-icon").hide();
            if(response.error) {                    
                $(".recent-list-wrap .error-msg").text(response.error);
            } else {
                $(".reviewer-stat h1").text(response.data.reviewerCount);
                $(".designer-stat h1").text(response.data.designerCount);
            }
        }, function() {
            $(".recent-list-wrap .loading-icon").hide();
            $(".recent-list-wrap .error-msg").text(config.serverError);
        });
    }

    //get recent products based on role
    function getRecentProductList(response) {
        var getProductsUrl = config.serverURL + config.getRecentProducts + "?type=" + recentListMapper[response.data.roles[0]] + "&queryParam=&start=0&end=" + config.recentProductsCount;   
        getRequest(getProductsUrl, function(response) {
            $(".recent-list-wrap .loading-icon").hide();
            if(response.error) {                    
                $(".recent-list-wrap .error-msg").text(response.error);
            } else {
                if(response.data && response.data.total > 4) {
                    $(".filter-link").show();
                }
                if(response.data && response.data.total === 0) {
                    $(".no-data-msg").show();
                }
                var preDigit = response.data.total > 9 ? "" : "0";
                $(".recent-prod-count").text("(" + preDigit + response.data.total + ")");
                $.each(response.data.products, function(index, product) {
                    var productListHtml = `<li class="clearfix" onclick="openProduct(\'` + product.productID + `\')">
                                                <img src="`+ product.images[0] +`">
                                                <div>
                                                <span class="title">` + product.name + `</span>
                                                <span class="message truncate">Product ID:` + product.productID + `</span>
                                                </div>
                                           </li>`
                    $(".recently-rejected-list").append(productListHtml);
                });

            }
        }, function() {
            $(".recent-list-wrap .loading-icon").hide();
            $(".recent-list-wrap .error-msg").text(config.serverError);
        });
    }    

    //load list view grid on clicking view all
    $( ".filter-link" ).on( "click", function() {
        localStorage.setItem("recentList", recentListMapper[currentUser.roles[0]]);
        window.location = '/image-list';
    });

    // $('body').on('click', '.month-item', function() {
    //     var monthIndex = months.indexOf($(this).text()) + 1;
    //     $(".month-dropdown .selected-month").text($(this).text());
    //     showStatisticsData(statistics, monthIndex);    
    // });


    //set dashboard card values
    function showStatisticsData(data) {  
        //console.log(data);
        $("#total-photos").text(data.total);
        
        switch (currentUser.roles[0]) {
            
            case 'supplier':
                $("#rejected").text(data.rejToSupplier);
                $("#to-be-approved").text(data.toBeApproved);
                $("#digitized").text(data.subToApprover + data.rejFromApprover + data.approved);
                
                break;
            case 'designer':
                $("#rejected").text(data.rejFromApprover);
                $("#to-be-approved").text(data.toBeApproved);
                $("#digitized").text(data.approved);
                break;
            case 'reviewer':
                $("#rejected").text(data.rejFromApprover);
                $("#to-be-approved").text(data.subToApprover);
                $("#digitized").text(data.approved);
                break;
            default:
                $("#rejected").text(data.rejFromApprover + data.rejToSupplier);
                $("#to-be-approved").text(data.subToApprover + data.toBeApproved);
                $("#digitized").text(data.approved);
                 
        }
             
    };

    //set the graph labels and show data based on roles
    function getGraphEntries() {
        switch (currentUser.roles[0]) {
            case 'designer':
                return { primary: {key: "approved", value: "Digitized"}, secondary: {key: "toBeApproved", value: "Yet to Approve"} };
                break;
            case 'reviewer':
                return { primary: {key: "approved", value: "Digitized"}, secondary: {key: "subToApprover", value: "Yet to Approve"} };
                break;
            default:
                return { primary: {key: "total", value: "Total Photos"}, secondary: {key: "approved", value: "Digitized"} };
        }            
    }

    //find the max value from data for y-axis values
    function getMaxValue(data) {
        var priMaxValue = data.reduce(function(a, b) {
            return data.find(function(status){
                return status[graphEntries.primary.key] === Math.max(a[graphEntries.primary.key], b[graphEntries.primary.key]);
            });
        })[graphEntries.primary.key];

        var secMaxValue = data.reduce(function(a, b) {
            return data.find(function(status){
                return status[graphEntries.secondary.key] === Math.max(a[graphEntries.secondary.key], b[graphEntries.secondary.key]);
            });
        })[graphEntries.secondary.key];
        return Math.max(priMaxValue, secMaxValue);
    }

    //configure performance chart
    function showStatisticsGraph(data) {         
        graphEntries = getGraphEntries();    
        //get max total value to plot y-axis
        var maxValue;
        if(data.length > 0) {
            maxValue = getMaxValue(data);
        } else {
            maxValue = 10;
        }
            var flotDashBasicData = formGraphData(data);          
            var flotDashBasic = $.plot('#flotDashBasic', flotDashBasicData, {
            series: {
                lines: {
                    show: true,
                    fill: true,
                    lineWidth: 1,
                    fillColor: {
                        colors: [{
                            opacity: 0.7,
                        }, {
                            opacity: 0.7
                        }]
                    }
                },
                points: {
                    show: true,
                    radius: 4
                },
                shadowSize: 0
            },
            grid: {                
                hoverable: true,
                clickable: true,
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                labelMargin: 15,
                backgroundColor: 'transparent'
            },
            yaxis: {
                min: 0,
                max: (maxValue > 15) ? maxValue * 1.5 : 20,
                color: 'rgba(0,0,0,0.1)'
            },
            xaxis: {
                mode: 'categories',
                color: 'rgba(0,0,0,0.1)'
            },
            tooltip: true,
            tooltipOpts: {
                content: '%s: %y',
                shifts: {
                    x: -60,
                    y: 25
                },
                defaultTheme: false
            },
            legend: {
                container: $(".legend-wrap")
            }
        });

    }
    function getCurrentMonth() {
        return new Date().getMonth() + 1;
    }
    function formGraphData(data) {
        var graphData = [{"label": graphEntries.primary.value, data: [], color: "#f1efac"},
                         {"label": graphEntries.secondary.value, data: [], color: "#6bc5af"}];
        for(var i=1; i <= getCurrentMonth(); i++) {
            var monthData = data.find(function(statistics) {
                return statistics.month === i;
            });
            if(monthData) {
                graphData[0].data.push([months[monthData.month - 1], monthData[graphEntries.primary.key]]);
                graphData[1].data.push([months[monthData.month - 1], monthData[graphEntries.secondary.key]]);
            } else {
                graphData[0].data.push([months[i - 1], 0]);
                graphData[1].data.push([months[i - 1], 0]);
            }
        }
        return graphData;
    }    
});

function openProduct(productId) {
    localStorage.setItem("productToUpdate", productId);    
    if(currentUser.roles[0] === 'supplier') {
        window.location = '/QR-scanner';
    } else if(currentUser.roles[0] === 'designer' || currentUser.roles[0] === 'reviewer') {
        window.location = '/image-list';
    }
}

var getProfilePromise = getProfile();
