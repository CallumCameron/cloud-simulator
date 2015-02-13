var resources = [
    {
        name: "compute",
        costMoney: 1,
        costPower: 3,
        image: "placeholder.png",
        tooltip: "Computation: processors to run the code"
    },
    {
        name: "network",
        costMoney: 3,
        costPower: 1,
        image: "placeholder.png",
        tooltip: "Connectivity: network infrastructure in the data centre"
    },
    {
        name: "storage",
        costMoney: 2,
        costPower: 2,
        image: "placeholder.png",
        tooltip: "Storage: hard drives and SSDs"
    }
];

var initResourceCounter = function() {
    var counter = {};
    for (var i = 0; i < resources.length; i++) {
        counter[resources[i].name] = 0;
    }
    return counter;
};

var demand = initResourceCounter();
var provision = initResourceCounter();

var clientTypes = [
    {
        name: "Facebook",
        compute: 0.2,
        network: 0.2,
        storage: 0.2
    },
    {
        name: "YouTube",
        compute: 0.2,
        network: 1,
        storage: 0.8
    }
];


var createSlider = function(name, min, max, step, image, tooltip, widthPercent) {
    var column = $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%");
    var slider = $("<div>").addClass("slider-slider").attr("id", name + "-slider");
    var text = $("<p>").addClass("slider-text").attr("id", name + "-text").text("0");
    var img = $("<img>").addClass("slider-img").attr("src", image).attr("title", tooltip);

    column.append(slider, text, img);

    slider.slider({
        orientation: "vertical",
        range: "min",
        min: min,
        max: max,
        value: min,
        step: step,
        slide: function(event, ui) {
            text.text(slider.slider("value"));
        },
        change: function(event, ui) {
            text.text(slider.slider("value"));
        }
    });

    text.text(slider.slider("value"));

    return column;
};

var createLoadBox = function(name, unit, widthPercent) {
    return $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%").append(
        $("<div>").addClass("load-box-colour").attr("id", name + "-load-box"),
        $("<p>").addClass("load-box-text").append(
            $("<span>").attr("id", name + "-load-text").text("0"),
            unit
        )
    );
};

var update = function() {
    updateClients();
    updateCloud();
    updateLoad();
};

var updateClients = function() {
    for (var i = 0; i < resources.length; i++) {
        var resource = resources[i].name;
        demand[resource] = 0;
        for (var j = 0; j < clientTypes.length; j++) {
            demand[resource] += clientTypes[j][resource] * parseInt($("#" + clientTypes[j].name + "-text").text());
        }
    }
};

var updateCloud = function() {
    var totalMoney = 0;
    var totalPower = 0;
    for (var i = 0; i < resources.length; i++) {
        var resource = resources[i];
        var units = parseInt($("#" + resource.name + "-text").text());
        provision[resource.name] = units;
        totalMoney += resource.costMoney * units;
        totalPower += resource.costPower * units;
    }

    $("#cost-money").text(totalMoney);
    $("#cost-power").text(totalPower);
};

var updateLoad = function() {
    var updateIndividualLoad = function(name) {
        var load = Math.round(demand[name] / provision[name] * 100);
        $("#" + name + "-load-text").text(Math.min(load, 100));

        var h = 0;

        if (load < 50) {
            h = 120;
        }
        else if (load > 100) {
            h = 0;
        }
        else {
            h = Math.round((1 - ((load - 50) / 50)) * 120);
        }

        $("#" + name + "-load-box").attr("style", "background-color: hsl(" + h + ", 80%, 50%);");
    };

    for (var i = 0; i < resources.length; i++) {
        updateIndividualLoad(resources[i].name);
    }
};

var equipmentFailure = function() {
    for (var i = 0; i < resources.length; i++) {
        var slider = $("#" + resources[i].name + "-slider");
        var value = slider.slider("value");
        var min = slider.slider("option", "min");
        var step = slider.slider("option", "step");
        var change = Math.round(Math.random() * 3) * step;

        $("#" + resources[i].name + "-slider").slider("value", Math.max(value - change, min));
    }
};

var setupClientColumn = function(clientType) {
    $("#demand-section").append(
        createSlider(clientType.name, 0, 100, 1, "placeholder.png", clientType.name, 100.0/clientTypes.length)
    );
};

var setupCloudColumn = function(resource) {
    var width = 100.0 / resources.length;
    $("#load-section").append(createLoadBox(resource.name, "%", width));
    $("#provision-section").append(createSlider(
        resource.name,
        10,
        100,
        10,
        resource.image,
        resource.tooltip + ". One unit costs: £" + resource.costMoney + "/s, " + resource.costPower + " W.",
        width
    ));
}

var main = function() {
    $("#response-section").append(createLoadBox("response", " ms", 100));

    for (var i = 0; i < clientTypes.length; i++) {
        setupClientColumn(clientTypes[i]);
    }

    for (var i = 0; i < resources.length; i++) {
        setupCloudColumn(resources[i]);
    }

    $("button").button();
    $(document).tooltip();

    $(".failure-button").click(equipmentFailure);

    update();
    setInterval(update, 1000);
}

$(document).ready(main);
