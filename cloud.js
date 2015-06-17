$(document).ready(function() {
    var COMPUTE = "compute";
    var NETWORK = "network";
    var STORAGE = "storage";

    var BASE_RESPONSE_TIME = 100;
    var PARTICLE_CLASS = "particle";

    function Timer(callback) {
        var frameNum = 1;
        var intervalID = null;
        var running = false;

        function tick() {
            callback(frameNum);
            frameNum++;
        }

        function startInternal() {
            tick();
            intervalID = setInterval(tick, 100);
        }

        return {
            start: function() {
                if (!running) {
                    running = true;
                    startInternal();
                }
            },
            pause: function() {
                if (intervalID !== null) {
                    clearInterval(intervalID);
                    intervalID = null;
                }
            },
            resume: function() {
                if (running && intervalID === null) {
                    startInternal();
                }
            },
            reset: function() {
                this.pause();
                frameNum = 1;
                running = false;
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

        function getValue() {
            return slider.slider("value");
        }

        function decrease(el, steps) {
            slider.slider("value", Math.max(getValue() - steps * step, min));
            if (steps !== 0) {
                el.add(Spark(slider.offset().left + Math.random() * slider.width(), slider.offset().top + Math.random() * slider.height()));
                el.add(Spark(slider.offset().left + Math.random() * slider.width(), slider.offset().top + Math.random() * slider.height()));
            }
        }

        return {
            addTo: function(parent) {
                parent.append(column);
                return this;
            },
            getValue: getValue,
            setValue: function(val) {
                slider.slider("value", val);
                return this;
            },
            decrease: function(el, steps) {
                decrease(el, steps);
                return this;
            },
            randomDecrease: function(el) {
                var RANDOM_RANGE = 4;
                var steps = Math.round(Math.random() * RANDOM_RANGE);
                decrease(el, steps);
                return this;
            },
            enable: function() {
                slider.slider("enable");
            },
            disable: function() {
                slider.slider("disable");
            },
            reset: function() {
                this.setValue(min);
                return this;
            }
        };
    }

    function LoadBox(unit, widthPercent) {
        var value = 0;
        var hue = 0;
        var text = $("<span>").text(value);
        var span = $("<span>").append(text, unit);
        var paragraph = $("<p>").addClass("load-box-text").append(span);

        var colourBox = $("<div>").addClass("load-box-colour");
        var column = $("<div>").addClass("panel-column").attr("style", "width: " + widthPercent + "%").append(
            colourBox,
            paragraph
        );

        var loadBox = {
            addTo: function(parent) {
                parent.append(column);
                return this;
            },
            addToExisting: function(colourBoxParent, textParent) {
                colourBoxParent.append(colourBox);
                textParent.append(span);
                return this;
            },
            getValue: function() {
                return value;
            },
            getHue: function() {
                return hue;
            },
            setValue: function(percent, textOverride) {
                value = percent;

                // Update the colour of the box
                hue = 0;

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

    function CumulativeResponseTimeBox() {
        var loadBox = LoadBox(" ms", 100);
        loadBox.addToExisting($("#cumulative-response-load"), $("#cumulative-response-text"));
        var readings = 0;
        var averageResponseTime = 0;

        return {
            getAverageResponseTime: function() {
                return Math.round(averageResponseTime);
            },
            getTotalResponseTime: function() {
                return Math.round(averageResponseTime * readings);
            },
            getAverageHue: function() {
                return loadBox.getHue();
            },
            add: function(val) {
                averageResponseTime = (readings * averageResponseTime + val) / (readings + 1.0);
                readings++;
                var colourPercent = ((averageResponseTime - BASE_RESPONSE_TIME) / 2.0) + 50;
                loadBox.setValue(colourPercent, averageResponseTime);
                return this;
            },
            reset: function() {
                averageResponseTime = 0;
                readings = 0;
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

    function CostDisplay(money, moneyImg, power, powerImg, cost) {
        // This is given existing IDs, unlike the other widgets,
        // because cost per tick and overall cost are displayed
        // differently, despite being conceptually the same.

        moneyImg.tooltip({ container: "body" });
        powerImg.tooltip({ container: "body" });

        return {
            update: function() {
                money.text(cost.getMoney());
                power.text(cost.getPower());
            }
        };
    }

    function CountdownTimer(parent, startCallback, stopCallback, doneCallback) {
        var WARNING_CLASS = "text-danger";
        var startingValue = 0;
        var seconds = 0;
        var visible = true;

        var paragraph = $("<p>").addClass("text-center");
        var display = $("<strong>");
        paragraph.append(display);

        var startButton = $("<button>").addClass("btn").addClass("btn-block").addClass("btn-success").text("Go!");
        var stopButton = $("<button>").addClass("btn").addClass("btn-block").addClass("btn-danger").text("Stop");

        parent.append(paragraph, startButton, stopButton);

        stopButton.hide();

        function setValue(val) {
            function format(val) {
                if (val < 10) {
                    return "0" + val;
                } else {
                    return val;
                }
            }

            seconds = Math.max(val, 0);
            var min = Math.floor(seconds / 60);
            var sec = seconds % 60;
            display.text(format(min) + ":" + format(sec));
            if (seconds <= 10) {
                display.addClass(WARNING_CLASS);
            } else {
                display.removeClass(WARNING_CLASS);
            }
        }

        function reset() {
            if (visible) {
                startButton.show();
                stopButton.hide();
                setValue(startingValue);
            }
        }

        startButton.click(function() {
            startButton.hide();
            stopButton.show();
            startCallback();
        });

        stopButton.click(function() {
            reset();
            stopCallback();
        })

        return {
            show: function(val) {
                visible = true;
                display.show();
                startButton.show();
                stopButton.hide();
                startingValue = val;
                setValue(val);
            },
            hide: function() {
                visible = false;
                display.hide();
                startButton.hide();
                stopButton.hide();
            },
            setValue: function(val) {
                startingValue = val;
                setValue(val);
            },
            tick: function() {
                if (visible && seconds > 0) {
                    setValue(seconds - 1);
                    if (seconds <= 0) {
                        doneCallback();
                    }
                }
            },
            reset: reset
        };
    }

    function Resource(name, unitCost, image, tooltip) {
        var WIDTH = 33;
        var STEP = 10;
        var loadBox = LoadBox("%", WIDTH).addTo($("#load-section"));
        var slider = Slider(
            10,
            100,
            STEP,
            image,
            tooltip + ". One unit costs: £" + unitCost.getMoney() + "/s, " + unitCost.getPower() + " W.",
            WIDTH
        ).addTo($("#provision-section"));

        var demandSources = [];
        var loadPercent = 0;

        // The desired position is where the slider would 'like' to be given the current load
        var DESIRED_PERCENT = 60;
        var autoMode = false;

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

                var sliderPos = slider.getValue();

                loadPercent = Math.round(demand / sliderPos * 100);
                loadBox.setValue(Math.min(loadPercent, 100));

                var raw = Math.ceil((demand / DESIRED_PERCENT * 100) / STEP) * STEP;
                var desiredPosition = Math.min(Math.max(raw, 10), 100);

                if (autoMode) {
                    if (sliderPos < desiredPosition) {
                        slider.setValue(sliderPos + STEP);
                    } else if (sliderPos > desiredPosition) {
                        slider.setValue(sliderPos - STEP);
                    }
                }

                return this;
            },
            getLoadPercent: function() {
                return loadPercent;
            },
            getTickCost: function() {
                return unitCost.times(slider.getValue());
            },
            equipmentFailure: function(el, steps) {
                slider.decrease(el, steps);
                return this;
            },
            randomEquipmentFailure: function(el) {
                slider.randomDecrease(el);
                return this;
            },
            enableSlider: function() {
                slider.enable();
                autoMode = false;
            },
            disableSlider: function() {
                slider.disable();
                autoMode = false;
            },
            enableAutoMode: function() {
                slider.disable();
                autoMode = true;
            },
            reset: function() {
                loadBox.reset();
                slider.reset();
                autoMode = false;
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
            setNumClients: function(num) {
                slider.setValue(num);
                return this;
            },
            getMaxClients: function() {
                return MAX_CLIENTS;
            },
            getDemand: function(name) {
                return unitDemand[name] * slider.getValue();
            },
            enableSlider: function() {
                slider.enable();
            },
            disableSlider: function() {
                slider.disable();
            },
            reset: function() {
                slider.reset();
                return this;
            }
        };
    }

    function EffectsList() {
        function Node(val) {
            return {
                val: val,
                prev: null,
                next: null
            };
        }

        var head = null;
        var tail = null;

        function unlink(node) {
            if (node.prev === null && node.next === null) {
                // Single-element list
                head = null;
                tail = null;
                return null;
            } else if (node.prev === null) {
                // Head of a list with at least two elements
                head = node.next;
                head.prev = null;
                return head;
            } else if (node.next === null) {
                // Tail of a list with at least two elements
                tail = node.prev;
                tail.next = null;
                return null;
            } else {
                // Somewhere in the middle
                node.prev.next = node.next;
                node.next.prev = node.prev;
                return node.next;
            }
        }
        return {
            add: function(effect) {
                if (head === null) {
                    head = tail = Node(effect);
                } else {
                    tail.next = Node(effect);
                    tail.next.prev = tail;
                    tail = tail.next;
                }
            },
            tick: function() {
                var node = head;
                while (node !== null) {
                    if (!node.val.tick()) {
                        node = unlink(node);
                    } else {
                        node = node.next;
                    }
                }
            },
            reset: function() {
                head = null;
                tail = null;
            }
        };
    }

    function Spark(x, y) {
        var NUM_SPARKS = 5;
        var timer = Math.round(Math.random() * 2);
        return {
            tick: function() {
                if (timer <= 0) {
                    for (var i = 0; i < NUM_SPARKS; i++) {
                        var spark = $("<div>").addClass(PARTICLE_CLASS).addClass("spark");

                        var width = 4;
                        var height = 3;

                        if (Math.random() > 0.5) {
                            var tmp = width;
                            width = height;
                            height = tmp;
                        }

                        spark.attr("style", "left: " + x + "px; top: " + y + "px; width: " + width + "px; height: " + height + "px;");

                        $("body").append(spark);

                        var distance = 40 + Math.random() * 20;
                        var time = 200 + Math.random() * 150;
                        var angle = Math.random() * 2 * Math.PI;

                        spark.animate(
                            {
                                left: x + distance * Math.cos(angle),
                                top: y + distance * Math.sin(angle)
                            },
                            time,
                            "linear",
                            function() { $(this).remove(); }
                        );
                    }
                    return false;
                } else {
                    timer--;
                    return true;
                }
            }
        }
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

    function UI(timerCallback, replayIntroCallback, countdownTimerStartCallback, countdownTimerDoneCallback) {
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
        var cumulativeResponseTime = CumulativeResponseTimeBox();
        var cumulativeResponseRow = $("#cumulative-response-row");

        var costThisTickDisplay = CostDisplay(
            $("#tick-cost-money"),
            $("#tick-cost-money-img"),
            $("#tick-cost-power"),
            $("#tick-cost-power-img"),
            costThisTick
        );

        var totalCostDisplay = CostDisplay(
            $("#total-cost-money"),
            $("#total-cost-money-img"),
            $("#total-cost-energy"),
            $("#total-cost-energy-img"),
            totalCost
        );

        var scoreBox = ScoreBox();

        var countdownTimer = CountdownTimer($("#total-cost-section"),
                                            function() {
                                                startTimer();
                                                countdownTimerStartCallback();
                                            },
                                            function() {
                                                reset();
                                                countdownTimerDoneCallback();
                                            },
                                            function() {
                                                pause();
                                                scoreBox.run(
                                                    totalCost.getMoney(),
                                                    totalCost.getPower(),
                                                    cumulativeResponseTime.getAverageResponseTime(),
                                                    cumulativeResponseTime.getAverageHue(),
                                                    function() { resume(); countdownTimerDoneCallback(); }
                                                );
                                            });

        function shakeCloudPanel() {
            $("#cloud-panel").effect("shake", { distance: 10 });
        }

        function equipmentFailure(vals) {
            var i = 0;
            while (i < vals.length && i < resources.length) {
                resources[i].equipmentFailure(effects, vals[i]);
                i++;
            }
            shakeCloudPanel();
        }

        function randomEquipmentFailure() {
            for (var i = 0; i < resources.length; i++) {
                resources[i].randomEquipmentFailure(effects);
            }
            shakeCloudPanel();
        }

        var failureButton = $("#failure-button");
        failureButton.click(randomEquipmentFailure);

        var resetCostButton = $("#reset-cost-button");
        resetCostButton.click(function() {
            totalCost.reset();
            totalCostDisplay.update();
            cumulativeResponseTime.reset();
        });

        var maxClients = 0;
        for (i = 0; i < clientTypes.length; i++) {
            maxClients += clientTypes[i].getMaxClients();
        }

        var network = NetworkAnimation($(".network-main"), maxClients);

        var effects = EffectsList();

        $("button").button();
        $("button").tooltip({ container: "body" });

        $("#btn-replay-intro").click(replayIntroCallback);

        function tick(frameNum) {
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
                cumulativeResponseTime.add(responseTimeBox.getResponseTime());

                totalCost.increaseBy(costThisTick);
                costThisTickDisplay.update();
                totalCostDisplay.update();
                countdownTimer.tick();
            }

            var numClients = 0;
            for (i = 0; i < clientTypes.length; i++) {
                numClients += clientTypes[i].getNumClients();
            }

            network.tick(frameNum, numClients, responseTimeBox.getResponseTime());
            effects.tick();

            timerCallback(frameNum);
        }

        var mainTimer = Timer(tick);

        function startTimer() {
            mainTimer.start();
        }

        function pause() {
            mainTimer.pause();
            network.pause();
            $("." + PARTICLE_CLASS).pause();
        }

        function resume() {
            mainTimer.resume();
            network.resume();
            $("." + PARTICLE_CLASS).resume();
        }

        function reset() {
            mainTimer.reset();
            $("#cloud-panel").stop(true, true);

            var i;

            for (i = 0; i < resources.length; i++) {
                resources[i].reset();
            }

            for (i = 0; i < clientTypes.length; i++) {
                clientTypes[i].reset();
            }

            responseTimeBox.reset();
            cumulativeResponseTime.reset();

            costThisTick.reset();
            totalCost.reset();
            costThisTickDisplay.update();
            totalCostDisplay.update();
            countdownTimer.reset();

            network.reset();
            effects.reset();
            $("." + PARTICLE_CLASS).remove();
        }

        var aboutBox = AboutBox();
        $("#btn-about").click(function() {
            pause();
            aboutBox.run(resume);
        });

        return {
            resources: resources,
            clientTypes: clientTypes,
            getResponseTime: function() {
                return responseTimeBox.getValue();
            },
            showCumulativeResponseTime: function() {
                cumulativeResponseRow.show();
            },
            hideCumulativeResponseTime: function() {
                cumulativeResponseRow.hide();
            },
            showCountdownTimer: function(val) {
                countdownTimer.show(val);
            },
            hideCountdownTimer: function() {
                countdownTimer.hide();
            },
            showResetCostButton: function() {
                resetCostButton.show();
            },
            hideResetCostButton: function() {
                resetCostButton.hide();
            },
            showFailureButton: function() {
                failureButton.show();
            },
            hideFailureButton: function() {
                failureButton.hide();
            },
            enableDemandSliders: function() {
                for (var i = 0; i < clientTypes.length; i++) {
                    clientTypes[i].enableSlider();
                }
            },
            disableDemandSliders: function() {
                for (var i = 0; i < clientTypes.length; i++) {
                    clientTypes[i].disableSlider();
                }
            },
            setNumClients: function(vals) {
                var i = 0;
                while (i < clientTypes.length && i < vals.length) {
                    clientTypes[i].setNumClients(vals[i]);
                    i++;
                }
            },
            enableResourceSliders: function() {
                for (var i = 0; i < resources.length; i++) {
                    resources[i].enableSlider();
                }
            },
            disableResourceSliders: function() {
                for (var i = 0; i < resources.length; i++) {
                    resources[i].disableSlider();
                }
            },
            enableResourceAutoSliders: function() {
                for (var i = 0; i < resources.length; i++) {
                    resources[i].enableAutoMode();
                }
            },
            equipmentFailure: equipmentFailure,
            randomEquipmentFailure: randomEquipmentFailure,
            addEffect: function(effect) {
                effects.add(effect);
            },
            tick: tick,
            startTimer: startTimer,
            pause: pause,
            resume: resume,
            reset: reset
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

        if (pages.length === 1) {
            skipIntro.addClass(HIDDEN);
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

    function ScoreBox() {
        var modal = $("#score-box");
        var close = $("#score-box-close");
        var exitCallback = function() {};

        var moneyDisplay = $("#score-money");
        var energyDisplay = $("#score-energy");
        var colourBox = $("#score-colour");
        var responseDisplay = $("#score-response");

        modal.modal({
            backdrop: "static",
            keyboard: false,
            show: false
        });

        close.click(function() {
            modal.modal("hide");
            exitCallback();
        });

        return {
            run: function(money, energy, responseTime, colour, callback) {
                moneyDisplay.text(money);
                energyDisplay.text(energy);
                responseDisplay.text(responseTime);
                colourBox.attr("style", "background-color: hsl(" + colour + ", 100%, 50%);");
                exitCallback = callback;
                modal.modal("show");
            }
        };
    }

    function Mode(state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, ui, activeIndicator, dialogSequence) {
        var ACTIVE = "active";
        var firstTime = true;
        var dialog = DialogSequence(dialogSequence);

        return {
            enter: function() {
                ui.reset();
                activeIndicator.addClass(ACTIVE);
                enter(state, ui);
                if (firstTime) {
                    firstEnter(state);
                    firstTime = false;
                    this.playIntro();
                }
            },
            exit: function() {
                exit(state);
                activeIndicator.removeClass(ACTIVE);
            },
            tick: function(frameNum) {
                tick(state, ui, frameNum);
            },
            playIntro: function() {
                ui.pause();
                dialog.run(function() { ui.resume(); });
            },
            countdownTimerStart: function() {
                countdownTimerStart(state, ui);
            },
            countdownTimerDone: function() {
                countdownTimerDone(state, ui);
            }
        };
    }

    function ModeSelector() {
        var parent = $("#mode-selector");
        var currentMode = null;
        var modes = [];

        function changeMode(newMode) {
            if (newMode !== currentMode) {
                if (currentMode !== null) {
                    currentMode.exit();
                }
                currentMode = newMode;
                currentMode.enter();
            }
        }

        var ui = UI(function(frameNum) { currentMode.tick(frameNum); },
                    function() { currentMode.playIntro(); },
                    function() { currentMode.countdownTimerStart(); },
                    function() { currentMode.countdownTimerDone(); });

        return {
            addMode: function(name, state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, dialogSequence) {
                var li = $("<li>");
                var mode = Mode(state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, ui, li, dialogSequence);
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

    modes.addMode("Manual",
                  null,
                  function(state, ui) {
                      ui.hideCumulativeResponseTime();
                      ui.hideCountdownTimer();
                      ui.showResetCostButton();
                      ui.showFailureButton();
                      ui.enableDemandSliders();
                      ui.enableResourceSliders();
                      ui.startTimer();
                  },
                  function(state) {},
                  function(state) {},
                  function(state, ui, frameNum) {},
                  function(state, ui) {},
                  function(state, ui) {},
                  $("#dialog-manual-mode"));


    modes.addMode("Response",
                  {
                      failureTimer: 0,
                      randomDelay: function() {
                          // 300 frames = 30 seconds
                          return Math.random() * 300;
                      }
                  },
                  function(state, ui) {
                      ui.hideCumulativeResponseTime();
                      ui.hideCountdownTimer();
                      ui.showResetCostButton();
                      ui.hideFailureButton();
                      ui.enableDemandSliders();
                      ui.enableResourceAutoSliders();
                      state.failureTimer = Math.max(state.randomDelay(), 100);
                      ui.startTimer();
                  },
                  function(state) {},
                  function(state) {},
                  function(state, ui, frameNum) {
                      state.failureTimer--;
                      if (state.failureTimer <= 0) {
                          ui.randomEquipmentFailure();
                          state.failureTimer = state.randomDelay();
                      }
                  },
                  function(state, ui) {},
                  function(state, ui) {},
                  $("#dialog-response-mode"));

    var level = {
        length: 60,
        demand: {
            2: [10, 0],
            10: [50, 30],
            20: [40, 40],
            22: [40, 45],
            25: [40, 50],
            40: [20, 80],
            50: [0, 50],
            55: [0, 25],
            59: [0, 0]
        },
        failure: {
            30: [1, 3, 5]
        }
    };

    modes.addMode("Game",
                  null,
                  function(state, ui) {
                      ui.showCumulativeResponseTime();
                      ui.showCountdownTimer(level.length);
                      ui.hideResetCostButton();
                      ui.hideFailureButton();
                      ui.disableDemandSliders();
                      ui.disableResourceSliders();
                  },
                  function(state) {},
                  function(state) {},
                  function(state, ui, frameNum) {
                      if (frameNum % 10 === 0) {
                          var realFrameNum = Math.floor(frameNum / 10);
                          if (level.demand.hasOwnProperty(realFrameNum)) {
                              ui.setNumClients(level.demand[realFrameNum]);
                          }
                          if (level.failure.hasOwnProperty(realFrameNum)) {
                              ui.equipmentFailure(level.failure[realFrameNum]);
                          }
                      }
                  },
                  function(state, ui) {
                      ui.enableResourceSliders();
                  },
                  function(state, ui) {
                      ui.reset();
                      ui.disableResourceSliders();
                  },
                  $("#dialog-game-mode"));

    modes.activateFirstMode();
});
