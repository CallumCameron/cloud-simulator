$(document).ready(function() {
    var COMPUTE = "compute";
    var NETWORK = "network";
    var STORAGE = "storage";

    function Timer(callback) {
        var frameNum = 0;
        var intervalID = null;

        return {
            start: function() {
                if (intervalID === null) {
                    var tick = function() {
                        callback(frameNum);
                        frameNum++;
                    };
                    tick();
                    intervalID = setInterval(tick, 100);
                }
            },
            pause: function() {
                if (intervalID !== null) {
                    clearInterval(intervalID);
                    intervalID = null;
                }
            },
            reset: function() {
                this.pause();
                frameNum = 0;
            }
        };
    }

    function Slider(min, max, step, image, tooltip, widthPercent) {
        var column = $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%");
        var slider = $("<div>").addClass("slider-slider");
        var text = $("<p>").addClass("slider-text").text("0");
        var img = $("<img>").addClass("slider-img").attr("src", image).attr("title", tooltip);
        img.tooltip({ container: "body" });

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

        return {
            addTo: function(parent) {
                parent.append(column);
                return this;
            },
            getValue: function() {
                return slider.slider("value");
            },
            setValue: function(val) {
                slider.slider("value", val);
                return this;
            },
            randomDecrease: function() {
                var RANDOM_RANGE = 3;
                var change = Math.round(Math.random() * RANDOM_RANGE) * step;
                slider.slider("value", Math.max(this.getValue() - change, min));
                return this;
            },
            reset: function() {
                this.setValue(min);
                return this;
            }
        };
    }

    function LoadBox(unit, widthPercent) {
        var value = 0;
        var text = $("<span>").text(value);
        var colourBox = $("<div>").addClass("load-box-colour");
        var column = $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%").append(
            colourBox,
            $("<p>").addClass("load-box-text").append(
                text,
                unit
            )
        );

        var loadBox = {
            addTo: function(parent) {
                parent.append(column);
                return this;
            },
            getValue: function() {
                return value;
            },
            setValue: function(percent, textOverride) {
                value = percent;

                // Update the colour of the box
                var hue = 0;

                if (percent < 50) {
                    hue = 120;
                }
                else if (percent > 100) {
                    hue = 0;
                }
                else {
                    hue = Math.round((1 - ((percent - 50) / 50)) * 120);
                }

                colourBox.attr("style", "background-color: hsl(" + hue + ", 100%, 50%);");

                // Update the text
                text.text(Math.round(textOverride ? textOverride : percent));

                return this;
            },
            reset: function() {
                this.setValue(0);
                return this;
            }
        };

        loadBox.setValue(value);
        return loadBox;
    }

    function ResponseTimeBox() {
        var BASE_RESPONSE_TIME = 100;
        var loadBox = LoadBox(" ms", 100);
        var responseTime = BASE_RESPONSE_TIME;

        return {
            addTo: function(parent) {
                loadBox.addTo(parent);
                return this;
            },
            getResponseTime: function() {
                return responseTime;
            },
            setLoadPercent: function(percent) {
                if (percent < 50) {
                    responseTime = BASE_RESPONSE_TIME;
                }
                else {
                    responseTime = BASE_RESPONSE_TIME + (percent - 50) * 2;
                }
                loadBox.setValue(percent, responseTime);
                return this;
            },
            reset: function() {
                loadBox.reset();
                return this;
            }
        };
    }

    function Cost(money, power) {
        return {
            getMoney: function() {
                return money;
            },
            getPower: function() {
                return power;
            },
            increaseBy: function(other) {
                money += other.getMoney();
                power += other.getPower();
                return this;
            },
            decreaseBy: function(other) {
                money -= other.getMoney();
                power -= other.getPower();
                return this;
            },
            times: function(factor) {
                return Cost(money * factor, power * factor);
            },
            reset: function() {
                money = 0;
                power = 0;
                return this;
            }
        };
    }

    function CostDisplay(money, power, cost) {
        // This is given existing IDs, unlike the other widgets,
        // because cost per tick and overall cost are displayed
        // differently, despite being conceptually the same.

        return {
            update: function() {
                money.text(cost.getMoney());
                power.text(cost.getPower());
            }
        };
    }

    function Resource(name, unitCost, image, tooltip) {
        var width = 33;
        var loadBox = LoadBox("%", width).addTo($("#load-section"));
        var slider = Slider(
            10,
            100,
            10,
            image,
            tooltip + ". One unit costs: £" + unitCost.getMoney() + "/s, " + unitCost.getPower() + " W.",
            width
        ).addTo($("#provision-section"));

        var demandSources = [];
        var loadPercent = 0;

        return {
            getName: function() {
                return name;
            },
            addDemandSource: function(source) {
                demandSources.push(source);
                return this;
            },
            tick: function() {
                var demand = 0;
                for (var i = 0; i < demandSources.length; i++) {
                    demand += demandSources[i].getDemand(name);
                }

                loadPercent = Math.round(demand / slider.getValue() * 100);
                loadBox.setValue(Math.min(loadPercent, 100));
                return this;
            },
            getLoadPercent: function() {
                return loadPercent;
            },
            getTickCost: function() {
                return unitCost.times(slider.getValue());
            },
            equipmentFailure: function() {
                slider.randomDecrease();
                return this;
            },
            reset: function() {
                loadBox.reset();
                slider.reset();
                return this;
            }
        };
    }

    function ClientType(name, image, compute, network, storage) {
        var MAX_CLIENTS = 100;

        var unitDemand = {};
        unitDemand[COMPUTE] = compute;
        unitDemand[NETWORK] = network;
        unitDemand[STORAGE] = storage;

        var slider = Slider(
            0,
            MAX_CLIENTS,
            1,
            image,
            name + ": one unit needs " + compute + " computation, " + network + " connectivity, " + storage + " storage.",
            50
        ).addTo($("#demand-section"));

        return {
            getNumClients: function() {
                return slider.getValue();
            },
            getMaxClients: function() {
                return MAX_CLIENTS;
            },
            getDemand: function(name) {
                return unitDemand[name] * slider.getValue();
            },
            reset: function() {
                slider.reset();
                return this;
            }
        };
    }

    function NetworkAnimation(parent, maxClients) {
        var PACKET_CLASS = "network-packet";

        function PacketSpawner() {
            var PACKET_OFFSET = 3;
            var baseYPos = Math.random() * parent.height();
            var clientYPos = baseYPos;
            // var cloudYPos = parent.height() / 2;
            var cloudYPos = baseYPos;
            var lastSpawnedClient = 0;
            var lastSpawnedCloud = 0;
            var spawningCloud = false;
            var firstFrame = true;

            return {
                tick: function(frameNum, responseTime) {
                    function spawnClient() {
                        var packet = $("<div>").addClass(PACKET_CLASS);
                        packet.attr("style", "left: 0px; top: " + (clientYPos - PACKET_OFFSET) + "px;");
                        parent.append(packet);
                        packet.animate(
                            {
                                left: parent.width() - packet.width(),
                                top: cloudYPos - PACKET_OFFSET
                            },
                            2000,
                            "linear",
                            function() { spawningCloud = true; $(this).remove(); }
                        );
                        lastSpawnedClient = frameNum;
                    }

                    function spawnCloud() {
                        if (spawningCloud && (frameNum - lastSpawnedCloud > Math.floor(responseTime / 100.0))) {
                            var packet = $("<div>").addClass(PACKET_CLASS);
                            packet.attr("style", "left: " + (parent.width() - packet.width()) + "px; top: " + (cloudYPos + PACKET_OFFSET) + "px;");
                            parent.append(packet);
                            packet.animate(
                                {
                                    left: 0,
                                    top: clientYPos + PACKET_OFFSET
                                },
                                // 20 * responseTime,
                                2000,
                                "linear",
                                function() { $(this).remove(); }
                            );
                            lastSpawnedCloud = frameNum;
                        }
                    }

                    if (firstFrame) {
                        spawnClient();
                        firstFrame = false;
                    }
                    else {
                        if (frameNum - lastSpawnedClient > 10) {
                            spawnClient();
                        }
                        spawnCloud();
                    }
                }
            };
        }

        var packetSpawners = [];
        var numSpawnersNeeded = 0;

        return {
            tick: function(frameNum, numClients, responseTime) {
                if (frameNum % 10 === 0) {
                    numSpawnersNeeded = Math.ceil(numClients / maxClients * 10);
                }

                while (packetSpawners.length < numSpawnersNeeded) {
                    packetSpawners.push(PacketSpawner());
                }

                while (packetSpawners.length > numSpawnersNeeded) {
                    packetSpawners.pop();
                }

                for (var i = 0; i < packetSpawners.length; i++) {
                    packetSpawners[i].tick(frameNum, responseTime);
                }
            },
            pause: function() {
                $("." + PACKET_CLASS).pause();
            },
            resume: function() {
                $("." + PACKET_CLASS).resume();
            },
            reset: function() {
                packetSpawners = [];
                numSpawnersNeeded = 0;
                $("." + PACKET_CLASS).remove();
            }
        };
    }

    function UI(replayIntro) {
        var i;
        var costThisTick = Cost(0, 0);
        var totalCost = Cost(0, 0);

        var resources = [
            Resource(COMPUTE, Cost(1, 3), "processor.png", "Computation: processors to run the code"),
            Resource(NETWORK, Cost(3, 1), "network.png", "Connectivity: network infrastructure in the data centre"),
            Resource(STORAGE, Cost(2, 2), "harddrive.png", "Storage: hard drives and SSDs")
        ];

        var clientTypes = [
            ClientType("Facebook", "facebook.png", 0.2, 0.2, 0.2),
            ClientType("YouTube", "yt.png", 0.2, 1, 0.8)
        ];

        for (i = 0; i < resources.length; i++) {
            for (var j = 0; j < clientTypes.length; j++) {
                resources[i].addDemandSource(clientTypes[j]);
            }
        }

        var responseTimeBox = ResponseTimeBox().addTo($("#response-section"));

        var costThisTickDisplay = CostDisplay($("#tick-cost-money"), $("#tick-cost-power"), costThisTick);
        var totalCostDisplay = CostDisplay($("#total-cost-money"), $("#total-cost-energy"), totalCost);

        $("#failure-button").click(function() {
            for (var i = 0; i < resources.length; i++) {
                resources[i].equipmentFailure();
            }
        });

        var maxClients = 0;
        for (i = 0; i < clientTypes.length; i++) {
            maxClients += clientTypes[i].getMaxClients();
        }

        var network = NetworkAnimation($(".network-main"), maxClients);

        $("button").button();
        $("button").tooltip({ container: "body" });

        $("#btn-replay-intro").click(replayIntro);

        return {
            resources: resources,
            clientTypes: clientTypes,
            getResponseTime: function() {
                return responseTimeBox.getValue();
            },
            tick: function(frameNum) {
                var i;
                if (frameNum % 10 === 0) {
                    var loadPercent = 0;
                    costThisTick.reset();

                    for (i = 0; i < resources.length; i++) {
                        resources[i].tick();
                        loadPercent += resources[i].getLoadPercent();
                        costThisTick.increaseBy(resources[i].getTickCost());
                    }

                    responseTimeBox.setLoadPercent(loadPercent / resources.length);

                    totalCost.increaseBy(costThisTick);
                    costThisTickDisplay.update();
                    totalCostDisplay.update();
                }

                var numClients = 0;
                for (i = 0; i < clientTypes.length; i++) {
                    numClients += clientTypes[i].getNumClients();
                }

                network.tick(frameNum, numClients, responseTimeBox.getResponseTime());
            },
            pause: function() {
                network.pause();
            },
            resume: function() {
                network.resume();
            },
            reset: function() {
                var i;

                for (i = 0; i < resources.length; i++) {
                    resources[i].reset();
                }

                for (i = 0; i < clientTypes.length; i++) {
                    clientTypes[i].reset();
                }

                responseTimeBox.reset();

                costThisTick.reset();
                totalCost.reset();
                costThisTickDisplay.update();
                totalCostDisplay.update();

                network.reset();
            }
        };
    }

    function DialogSequence(parentDiv) {
        var HIDDEN = "dialog-hidden";
        var header = $("<h4>").addClass("modal-title").text(parentDiv.attr("data-dialog-sequence-title"));
        var body = $("<div>").addClass("modal-body").append(parentDiv);
        var skipIntro = $("<button>").addClass("btn btn-default").attr("type", "button").text("Skip intro");
        var prevPage = $("<button>").addClass("btn btn-primary").attr("type", "button").text("Back");
        var nextPage = $("<button>").addClass("btn btn-primary").attr("type", "button").text("Next");

        var modal = $("<div>").addClass("modal fade")
            .attr("tabindex", "-1")
            .attr("role", "dialog")
            .attr("aria-labelledby", "thisModalLabel")
            .attr("aria-hidden", "true")
            .append(
                $("<div>").addClass("modal-dialog modal-lg").append(
                    $("<div>").addClass("modal-content").append(
                        $("<div>").addClass("modal-header").append(header),
                        body,
                        $("<div>").addClass("modal-footer").append(
                            skipIntro,
                            prevPage,
                            nextPage
                        )
                    )
                )
            );

        modal.modal({
            backdrop: "static",
            keyboard: false,
            show: false
        });

        var currentPage = 0;
        var pages = parentDiv.children();
        var exitCallback = function() {};

        for (var i = 0; i < pages.length; i++) {
            $(pages[i]).addClass(HIDDEN);
        }

        function showPage(pageNum) {
            $(pages[currentPage]).addClass(HIDDEN);
            $(pages[pageNum]).removeClass(HIDDEN);

            if (pageNum === 0) {
                prevPage.addClass(HIDDEN);
            }
            else {
                prevPage.removeClass(HIDDEN);
            }

            if (pageNum === pages.length - 1) {
                nextPage.text("Finish");
            }
            else {
                nextPage.text("Next");
            }

            currentPage = pageNum;
        }

        nextPage.click(function() {
            if (currentPage < pages.length - 1) {
                showPage(currentPage + 1);
            }
            else {
                modal.modal("hide");
                exitCallback();
            }
        });

        prevPage.click(function() {
            if (currentPage > 0) {
                showPage(currentPage - 1);
            }
        });

        skipIntro.click(function() {
            modal.modal("hide");
            exitCallback();
        });

        return {
            run: function(callback) {
                exitCallback = callback;
                showPage(0);
                modal.modal("show");
            }
        };
    }

    function AboutBox() {
        var modal = $("#about-box");
        var close = $("#about-box-close");

        modal.modal({
            backdrop: "static",
            keyboard: false,
            show: false
        });

        var exitCallback = function() {};

        close.click(function() {
            modal.modal("hide");
            exitCallback();
        });

        return {
            run: function(callback) {
                exitCallback = callback;
                modal.modal("show");
            }
        };
    }

    function Mode(enter, firstEnter, exit, tick, ui, activeIndicator, dialogSequence) {
        var ACTIVE = "active";
        var firstTime = true;
        var dialog = DialogSequence(dialogSequence);

        return {
            enter: function(callback) {
                ui.reset();
                activeIndicator.addClass(ACTIVE);
                enter();
                if (firstTime) {
                    firstEnter();
                    firstTime = false;
                    this.playIntro(callback);
                }
                else {
                    callback();
                }
            },
            exit: function() {
                exit();
                activeIndicator.removeClass(ACTIVE);
            },
            tick: function(frameNum) {
                ui.tick(frameNum);
                tick(frameNum);
            },
            playIntro: function(callback) {
                dialog.run(callback);
            }
        };
    }

    function ModeSelector() {
        var parent = $("#mode-selector");
        var currentMode = null;
        var modes = [];
        var mainTimer = Timer(function(frameNum) { currentMode.tick(frameNum); });

        function changeMode(newMode) {
            if (newMode !== currentMode) {
                mainTimer.reset();
                if (currentMode !== null) {
                    currentMode.exit();
                }
                currentMode = newMode;
                currentMode.enter(function() { mainTimer.start(); });
            }
        }

        function replayIntro() {
            mainTimer.pause();
            ui.pause();
            currentMode.playIntro(function() { ui.resume(); mainTimer.start(); });
        }

        var aboutBox = AboutBox();
        $("#btn-about").click(function() {
            mainTimer.pause();
            ui.pause();
            aboutBox.run(function() { ui.resume(); mainTimer.start(); });
        });

        var ui = UI(replayIntro);

        return {
            addMode: function(name, enter, firstEnter, exit, tick, dialogSequence) {
                var li = $("<li>");
                var mode = Mode(enter, firstEnter, exit, tick, ui, li, dialogSequence);
                var a = $("<a>").attr("href", "#").text(name + " mode").click(function() {
                    changeMode(mode);
                });

                li.append(a);
                parent.append(li);
                modes.push(mode);
                return mode;
            },
            activateFirstMode: function() {
                changeMode(modes[0]);
            }
        };
    }

    // Main
    var modes = ModeSelector();

    modes.addMode("Manual", function() {}, function() {}, function() {}, function(frameNum) {}, $("#dialog-manual-mode"));
    modes.addMode("Response", function() {}, function() {}, function() {}, function(frameNum) {}, $("#dialog-response-mode"));
    modes.addMode("Game", function() {}, function() {}, function() {}, function(frameNum) {}, $("#dialog-game-mode"));

    modes.activateFirstMode();
});
