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


var createSlider = function(name, max, image, tooltip, callback, widthPercent) {
    var column = $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%");
    var slider = $("<div>").addClass("slider-slider").attr("id", name + "-slider");
    var text = $("<p>").addClass("slider-text").attr("id", name + "-text").text("0");
    var img = $("<img>").addClass("slider-img").attr("src", image).attr("title", tooltip);

    column.append(slider, text, img);

    slider.slider({
        orientation: "vertical",
        range: "min",
        min: 1,
        max: max,
        value: 1,
        slide: function(event, ui) {
            text.text(slider.slider("value"));
            callback();
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
    var clients = parseInt($("#clients-text").text());

    demand["compute"] = clients;
    demand["network"] = 4 * clients;
    demand["storage"] = 2 * clients;
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
        $("#" + name + "-load-text").text(load);

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

var setupCloudColumn = function(resource) {
    var width = 100.0 / resources.length;
    $("#load-section").append(createLoadBox(resource.name, "%", width));
    $("#provision-section").append(createSlider(
        resource.name,
        100,
        resource.image,
        resource.tooltip + ". One unit costs: £" + resource.costMoney + "/h, " + resource.costPower + " W.",
        update,
        width
    ));
}

var main = function() {
    $("#response-section").append(createLoadBox("response", " ms", 100));
    $("#demand-section").append(
        createSlider("clients", 100, "placeholder.png", "Example client type", update, 100)
    );

    for (var i = 0; i < resources.length; i++) {
        setupCloudColumn(resources[i]);
    }

    $(document).tooltip();

    update();
}

$(document).ready(main);
