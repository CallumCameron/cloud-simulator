var resources = [
    {
        name: "compute",
        costMoney: 1,
        costPower: 3,
        image: "processor.png",
        tooltip: "Computation: processors to run the code"
    },
    {
        name: "network",
        costMoney: 3,
        costPower: 1,
        image: "network.png",
        tooltip: "Connectivity: network infrastructure in the data centre"
    },
    {
        name: "storage",
        costMoney: 2,
        costPower: 2,
        image: "harddrive.png",
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
        image: "facebook.png",
        compute: 0.2,
        network: 0.2,
        storage: 0.2
    },
    {
        name: "YouTube",
        image: "youtube.png",
        compute: 0.2,
        network: 1,
        storage: 0.8
    }
];

var totalMoneyUsed = 0;
var totalEnergyUsed = 0;


var packetSpawners = [];
var neededPacketSpawners = 0;

var createPacketSpawner = function() {
    // A packet spawner creates animated packets. One spawner handles both directions in a link, with the packets in the different directions offset slightly. There is not a one-to-one correspondence in the number of packets sent and received - it is just illustrative, and uses the assumption that more packets will be sent cloud-to-client than the other way around. Packets are sent from the client at a constant rate. Packets are sent from the cloud at a rate
    var netMain = $("#network-main");
    var start = 10 + Math.random() * (netMain.height() - 20);
    var spawner = {
        clientHeight: start,
        // cloudHeight: (Math.random() - 0.5) * 100 + start,
        cloudHeight: netMain.height() / 2,
        lastSpawnedClient: 0,
        lastSpawnedCloud: 0,
        spawningCloud: false,
        update: function(self) {
            if (frameNum - self.lastSpawnedClient > 10) {
                self.spawnClient(self);
            }
            self.spawnCloud(self);
        },
        spawnClient: function(self) {
            var packet = $("<div>").addClass("network-packet").attr("style", "left: 0px; top: " + (self.clientHeight - 5) + "px;");
            netMain.append(packet);
            packet.animate({ left: netMain.width() - packet.width(), top: self.cloudHeight - 5 }, 2000, "linear", function() { self.spawningCloud = true; $(this).remove(); });
            self.lastSpawnedClient = frameNum;
        },
        spawnCloud: function(self) {
            if (self.spawningCloud) {
                if (frameNum - self.lastSpawnedCloud > Math.floor(parseInt($("#response-load-text").text()) / 100.0)) {
                    var packet = $("<div>").addClass("network-packet");
                    packet.attr("style", "left: " + (netMain.width() - packet.width()) + "px; top: " + (self.cloudHeight + 5) + "px;");
                    netMain.append(packet);
                    packet.animate(
                        { left: 0, top: self.clientHeight + 5 },
                        // 20 * parseInt($("#response-load-text").text()),
                        2000,
                        "linear",
                        function() { $(this).remove(); }
                    );
                    self.lastSpawnedCloud = frameNum;
                }
            }
        }
    };

    spawner.spawnClient(spawner);
    packetSpawners.push(spawner);
};

var updatePacketSpawners = function() {
    if (frameNum % 10 === 0) {
        var clients = 0;
        var maxClients = 0;
        for (var i = 0; i < clientTypes.length; i++) {
            clients += $("#" + clientTypes[i].name + "-slider").slider("value");
            maxClients += $("#" + clientTypes[i].name + "-slider").slider("option", "max");
        }
        neededPacketSpawners = Math.ceil(clients / maxClients * 10);
    }

    while (packetSpawners.length < neededPacketSpawners) {
        createPacketSpawner();
    }

    while (packetSpawners.length > neededPacketSpawners) {
        packetSpawners.pop();
    }

    for (var i = 0; i < packetSpawners.length; i++) {
        packetSpawners[i].update(packetSpawners[i]);
    }
};


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

var frameNum = 0;

var update = function() {
    if (frameNum % 10 === 0) {
        updateClients();
        updateCloud();
        updateLoad();
        updateResponseTime();
    }
    updatePacketSpawners();

    frameNum++;
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

    totalMoneyUsed += totalMoney;
    totalEnergyUsed += totalPower;

    $("#total-cost-money").text(totalMoneyUsed);
    $("#total-cost-energy").text(totalEnergyUsed);
};

var redAmberGreen = function(percent) {
    var h = 0;

    if (percent < 50) {
        h = 120;
    }
    else if (percent > 100) {
        h = 0;
    }
    else {
        h = Math.round((1 - ((percent - 50) / 50)) * 120);
    }

    return h;
}

var updateLoad = function() {
    var updateIndividualLoad = function(name) {
        var load = Math.round(demand[name] / provision[name] * 100);
        $("#" + name + "-load-text").text(Math.min(load, 100));

        var h = redAmberGreen(load);
        $("#" + name + "-load-box").attr("style", "background-color: hsl(" + h + ", 80%, 50%);");
    };

    for (var i = 0; i < resources.length; i++) {
        updateIndividualLoad(resources[i].name);
    }
};

var updateResponseTime = function() {
    // With N resources, N*100% is full load
    var totalLoad = 0;
    var fullLoad = resources.length * 100;

    for (var i = 0; i < resources.length; i++) {
        var name = resources[i].name;
        totalLoad += demand[name] / provision[name] * 100;
    }

    var percent = totalLoad / fullLoad * 100.0;
    var h = redAmberGreen(percent);

    var responseTime = 0;

    if (percent < 50) {
        responseTime = 100;
    }
    else {
        responseTime = 100 + (percent - 50) * 2;
    }

    $("#response-load-text").text(Math.round(responseTime));
    $("#response-load-box").attr("style", "background-color: hsl(" + h + ", 80%, 50%);");
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
        createSlider(
            clientType.name,
            0,
            100,
            1,
            clientType.image,
            clientType.name + ": one unit needs " + clientType.compute + " computation, " + clientType.network + " connectivity, " + clientType.storage + " storage.",
            100.0/clientTypes.length)
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
    setInterval(update, 100);
}

$(document).ready(main);
