var URL = "http://localhost:5002/query";

$(document).ready($(function() {
    onQuerySelections();

    $('#submit').click(function() {
        asyncQuerySelections();
    });

    $(".dropdown-menu").on('click', 'li a', function(){
        var text = $(this).text().replace('>', '&gt').replace('<', '&lt');
        $(this).parent().parent().siblings(".btn:first-child").html(text+' <span class="caret"></span>');
        $(this).parent().parent().siblings(".btn:first-child").val(text);
        switch ($(this).parent().parent()[0].id) {
            case 'country-list':
                break;
            case 'brand-list':
                asyncQueryModels(text);
                break;
            case 'model-list':
                asyncQuerySpecs(text);
                break;
        }
    });
}));

function onQuerySelections() {
    asyncQueryCountries();
    asyncQueryBrands();
}

function asyncQueryCountries() {
    $.ajax({
        url: URL + "/countries",
        success: function(data, status) {
            var array = JSON.parse(data);
            $.each(array, function(index, value) {
                var li = '<li><a class="dropdown-item" href="#">' + value + '</a></li>';
                $('#country-list')
                    .append($(li));
            });
        },
        error: function() {
            console.log("Error querying MongoDB, check logs for details");
        }
    });
}

function asyncQueryBrands() {
    $.ajax({
        url: URL + "/brands",
        success: function(data, status) {
            var array = JSON.parse(data);
            $.each(array, function(index, value) {
                value = value.replace('>', '&gt').replace('<', '&lt');
                var li = '<li><a class="dropdown-item" href="#">' + value + '</a></li>';
                $('#brand-list')
                    .append($(li));
            });
        },
        error: function() {
            console.log("Error querying MongoDB, check logs for details");
        }
    });
}

function asyncQueryModels(brand) {
    brand = brand.replace('&gt', '>').replace('&lt', '<').replace("&", "and");
    $("#model-list").empty();
    $.ajax({
        url: URL + "/models?brand=" + brand,
        success: function(data, status) {
            $('#model').text('Model');
            var array = JSON.parse(data);
            $.each(array, function(index, value) {
                var li = '<li><a class="dropdown-item" href="#">' + value + '</a></li>';
                $('#model-list')
                    .append($(li));
            });
        },
        error: function() {
            console.log("Error querying MongoDB, check logs for details");
        }
    });
}

function asyncQuerySpecs(model) {
    $.ajax({
        url: URL + "/specs?model=" + model,
        success: function(data, status) {
            console.log(data);
            createTable(data);
        },
        error: function() {
            console.log("Error querying MongoDB, check logs for details");
        }
    });
}

function asyncQuerySelections() {
    var country = $('#country').text().trim();
    var brand = $('#brand').text().trim().replace("&", "and");
    var model = $('#model').text().trim();
    var sentence = "country=" + country + "&brand=" + brand + "&model=" + model;
    console.log(sentence);
    if (sentence.indexOf("Select") !== -1) {
        return;
    }

    $.ajax({
        url: URL + "/sentence?" + sentence,
        success: function(data, status) {
            console.log(data);
            fillData(data);
        },
        error: function() {
            console.log("Error querying MongoDB, check logs for details");
        }
    });
}

function createTable(str) {
    var selector = '#table';
    $(selector).bootstrapTable("load", []);
    try {
        var myList = $.parseJSON(str);
    } catch(e) {
        console.log(e);
        return;
    }

    var keys = [];
    $.map( myList, function( value, key ) {
        keys.push(key);
    });
    str = str.replace('>', '&gt').replace('<', '&lt');
    var data = $.parseJSON("[" + str + "]");
    $(selector).bootstrapTable({
        columns: generateColumns(keys)
    });
    $(selector).bootstrapTable("load", data);
}

function generateColumns(keys) {
    var list = [];
    keys.forEach(function(key) {
        var obj = {
            field: key,
            title: key,
            align: 'center',
            valign: 'middle'
        };
        list.push(obj);
    });
    return list;
}

function fillData(data) {
    var myChart = echarts.init(document.getElementById('chart'));
    var jsonData = $.parseJSON(data);

    var xAxis = [];
    var units = [];
    var price = [];
    for (var i = 0; i < jsonData.length; i++) {
        xAxis.push(jsonData[i]['PERIOD']);
        units.push(jsonData[i]['TOTAL UNITS']);
        price.push((jsonData[i]['TOTAL VALUE']/jsonData[i]['TOTAL UNITS']).toFixed(3));
    }

    var option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['Price', 'Units']
        },
        dataZoom : {
            show : true,
            realtime : true,
            type: 'inside'
        },
        xAxis: [
            {
                type: 'category',
                data: xAxis,
                axisLabel: {
                    rotate: 30
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: 'Price',
                splitLine: false,
                axisLabel: {
                    formatter: '{value} USD'
                }
            },
            {
                type: 'value',
                name: 'Units',
                splitLine: false
            }
        ],
        series: [
            {
                name: "Price",
                type: "line",
                data: price
            },
            {
                name: "Units",
                type: "bar",
                yAxisIndex: 1,
                data: units
            }
        ]
    };

    // Load data into the ECharts instance
    myChart.setOption(option);
}