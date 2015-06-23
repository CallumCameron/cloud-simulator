$(document).ready(function() {
    var COMPUTE = "compute";
    var NETWORK = "network";
    var STORAGE = "storage";

    var BASE_RESPONSE_TIME = 100;
    var PARTICLE_CLASS = "particle";

    function prettyNumber(i) {
        // From https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        return i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function percentToHue(percent) {
        if (percent < 50) {
            return 120;
        } else if (percent > 100) {
            return 0;
        } else {
            return Math.round((1 - ((percent - 50) / 50)) * 120);
        }
    }

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
            if (getValue() > min) {
                slider.slider("value", Math.max(getValue() - steps * step, min));
                if (steps !== 0) {
                    el.add(Spark(slider.offset().left + Math.random() * slider.width(), slider.offset().top + Math.random() * slider.height()));
                    el.add(Spark(slider.offset().left + Math.random() * slider.width(), slider.offset().top + Math.random() * slider.height()));
                    return true;
                }
            }
            return false;
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
                return decrease(el, steps);
            },
            randomDecrease: function(el) {
                var RANDOM_RANGE = 4;
                var steps = Math.round(Math.random() * RANDOM_RANGE);
                return decrease(el, steps);
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

                hue = percentToHue(percent);
                colourBox.attr("style", "background-color: hsl(" + hue + ", 100%, 50%);");

                text.text(prettyNumber(Math.round(textOverride ? textOverride : percent)));

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
                } else {
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
                money.text(prettyNumber(cost.getMoney()));
                power.text(prettyNumber(cost.getPower()));
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
            getStartingValue: function() {
                return startingValue;
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
        var MIN = 100;
        var MAX = 1000;
        var STEP = 100;
        var loadBox = LoadBox("%", WIDTH).addTo($("#load-section"));
        var slider = Slider(
            MIN,
            MAX,
            STEP,
            image,
            tooltip + ". " + STEP + " units cost: £" + Math.round(STEP * unitCost.getMoney()) + "/s, " + (Math.round(STEP * unitCost.getPower())) + " W.",
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
                var desiredPosition = Math.min(Math.max(raw, MIN), MAX);

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
            getMinTickCost: function() {
                return unitCost.times(MIN);
            },
            getMaxTickCost: function() {
                return unitCost.times(MAX);
            },
            equipmentFailure: function(el, steps) {
                return slider.decrease(el, steps);
            },
            randomEquipmentFailure: function(el) {
                return slider.randomDecrease(el);
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
            33
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
        var MAX_SPAWNERS = 10;

        function PacketSpawner(spawnerNum) {
            var clientYPos = spawnerNum * (parent.height() * 0.35 / MAX_SPAWNERS);
            var cloudYPos = 0.65 * parent.height() + clientYPos;
            var lastSpawnedClient = 0;
            var lastSpawnedCloud = 0;
            var spawningCloud = false;
            var startDelay = Math.floor(Math.random() * 10);
            var firstFrame = true;

            return {
                tick: function(frameNum, responseTime) {
                    function spawnClient() {
                        var packet = $("<div>").addClass(PACKET_CLASS);
                        packet.attr("style", "left: 0px; top: " + clientYPos + "px;");
                        parent.append(packet);
                        packet.animate(
                            {
                                left: parent.width() - packet.width()
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
                            packet.attr("style", "left: " + (parent.width() - packet.width()) + "px; top: " + cloudYPos + "px;");
                            parent.append(packet);
                            packet.animate(
                                {
                                    left: 0
                                },
                                2000,
                                "linear",
                                function() { $(this).remove(); }
                            );
                            lastSpawnedCloud = frameNum;
                        }
                    }

                    if (startDelay <= 0) {
                        if (firstFrame) {
                            spawnClient();
                            firstFrame = false;
                        } else {
                            if (frameNum - lastSpawnedClient > 10) {
                                spawnClient();
                            }
                            spawnCloud();
                        }
                    } else {
                        startDelay--;
                    }
                }
            };
        }

        var packetSpawners = [];
        var numSpawnersNeeded = 0;

        return {
            tick: function(frameNum, numClients, responseTime) {
                if (frameNum % 10 === 0) {
                    numSpawnersNeeded = Math.ceil(numClients / maxClients * MAX_SPAWNERS);
                }

                while (packetSpawners.length < numSpawnersNeeded) {
                    packetSpawners.push(PacketSpawner(packetSpawners.length));
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

    function UI(timerCallback, replayIntroCallback, countdownTimerStartCallback, countdownTimerDoneCallback, resetButtonCallback) {
        var i;
        var costThisTick = Cost(0, 0);
        var totalCost = Cost(0, 0);

        var resources = [
            Resource(COMPUTE, Cost(0.1, 0.3), "processor.png", "Computation: processors to run the code"),
            Resource(NETWORK, Cost(0.3, 0.1), "network.png", "Connectivity: network infrastructure in the data centre"),
            Resource(STORAGE, Cost(0.2, 0.2), "harddrive.png", "Storage: hard drives and SSDs")
        ];

        var clientTypes = [
            ClientType("Facebook", "facebook.png", 1, 1, 1),
            ClientType("Dropbox", "dropbox.png", 1, 2, 4),
            ClientType("YouTube", "yt.png", 1, 4, 3)
        ];

        for (i = 0; i < resources.length; i++) {
            for (var j = 0; j < clientTypes.length; j++) {
                resources[i].addDemandSource(clientTypes[j]);
            }
        }

        var minTickCost = Cost(0, 0);
        var maxTickCost = Cost(0, 0);

        for (i = 0; i < resources.length; i++) {
            minTickCost.increaseBy(resources[i].getMinTickCost());
            maxTickCost.increaseBy(resources[i].getMaxTickCost());
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

        var scoreBox = ScoreBox(minTickCost, maxTickCost);

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
                                                    countdownTimer.getStartingValue(),
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
            var didSomething = false;
            while (i < vals.length && i < resources.length) {
                didSomething = resources[i].equipmentFailure(effects, vals[i]) || didSomething;
                i++;
            }

            if (didSomething) {
                shakeCloudPanel();
            }

            return didSomething;
        }

        function randomEquipmentFailure() {
            var didSomething = false;
            for (var i = 0; i < resources.length; i++) {
                didSomething = resources[i].randomEquipmentFailure(effects) || didSomething;
            }

            if (didSomething) {
                shakeCloudPanel();
            }

            return didSomething;
        }

        var failureButton = $("#failure-button");
        failureButton.click(function() {
            // A manually-induced failure should always shake the
            // panel, to avoid user confusion, even if the failure
            // didn't actually do anything and the panel didn't shake
            // automatically.
            if (!randomEquipmentFailure()) {
                shakeCloudPanel();
            }
        });

        var resetCostButton = $("#reset-cost-button");
        resetCostButton.click(function() {
            reset();
            resetButtonCallback();
            startTimer();
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
            } else {
                prevPage.removeClass(HIDDEN);
            }

            if (pageNum === pages.length - 1) {
                nextPage.text("Finish");
            } else {
                nextPage.text("Next");
            }

            currentPage = pageNum;
        }

        nextPage.click(function() {
            if (currentPage < pages.length - 1) {
                showPage(currentPage + 1);
            } else {
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

    function ScoreBox(minTickCost, maxTickCost) {
        var modal = $("#score-box");
        var close = $("#score-box-close");
        var exitCallback = function() {};

        var moneyDisplay = $("#score-money");
        var moneyColour = $("#score-money-colour");

        var energyDisplay = $("#score-energy");
        var energyColour = $("#score-energy-colour");

        var responseDisplay = $("#score-response");
        var responseColour = $("#score-response-colour");

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
            run: function(runtime, money, energy, responseTime, colour, callback) {
                var minCost = minTickCost.times(runtime);
                var maxCost = maxTickCost.times(runtime);

                function setColour(val, min, max, box) {
                    var hue = percentToHue((val - min) / (max - min) * 100.0);
                    box.attr("style", "background-color: hsl(" + hue + ", 100%, 50%);");
                }

                moneyDisplay.text(prettyNumber(money));
                setColour(money, minCost.getMoney(), maxCost.getMoney(), moneyColour);

                energyDisplay.text(prettyNumber(energy));
                setColour(energy, minCost.getPower(), maxCost.getPower(), energyColour);

                responseDisplay.text(prettyNumber(responseTime));
                responseColour.attr("style", "background-color: hsl(" + colour + ", 100%, 50%);");

                exitCallback = callback;
                modal.modal("show");
            }
        };
    }

    function Mode(state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, resetButtonCallback, ui, activeIndicator, dialogSequence) {
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
            },
            resetButton: function() {
                resetButtonCallback(state, ui);
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
            } else {
                currentMode.playIntro();
            }
        }

        var ui = UI(function(frameNum) { currentMode.tick(frameNum); },
                    function() { currentMode.playIntro(); },
                    function() { currentMode.countdownTimerStart(); },
                    function() { currentMode.countdownTimerDone(); },
                    function() { currentMode.resetButton(); });

        return {
            addMode: function(name, state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, resetButtonCallback, dialogSequence) {
                var li = $("<li>");
                var mode = Mode(state, enter, firstEnter, exit, tick, countdownTimerStart, countdownTimerDone, resetButtonCallback, ui, li, dialogSequence);
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
                  function(state, ui) {
                      ui.enableResourceAutoSliders();
                      state.failureTimer = Math.max(state.randomDelay(), 100);
                  },
                  $("#dialog-response-mode"));

    var level = {
        length: 120,
        demand: {
            2: [5, 0, 0],
            4: [10, 0, 0],
            6: [15, 0, 0],
            8: [20, 0, 25],
            10: [25, 0, 50],
            12: [30, 0, 75],
            14: [35, 0, 75],
            16: [40, 40, 75],
            18: [45, 80, 75],
            20: [50, 80, 100],
            22: [55, 80, 100],
            24: [60, 80, 100],
            26: [65, 80, 100],
            28: [70, 30, 80],
            30: [75, 10, 80],
            32: [80, 0, 80],
            34: [85, 0, 80],
            36: [85, 0, 55],
            38: [85, 0, 55],
            40: [85, 10, 55],
            42: [80, 10, 55],
            44: [75, 10, 60],
            46: [70, 10, 60],
            48: [70, 0, 60],
            50: [70, 0, 60],
            52: [70, 0, 90],
            54: [70, 0, 90],
            56: [70, 0, 90],
            58: [70, 0, 90],
            60: [70, 0, 75],
            62: [70, 25, 75],
            64: [70, 50, 75],
            66: [70, 50, 75],
            68: [75, 50, 40],
            70: [80, 10, 40],
            72: [85, 0, 40],
            74: [90, 0, 40],
            76: [95, 0, 60],
            78: [100, 0, 60],
            80: [95, 0, 60],
            82: [90, 35, 60],
            84: [85, 65, 55],
            86: [80, 65, 55],
            88: [75, 65, 55],
            90: [70, 65, 55],
            92: [65, 70, 80],
            94: [60, 10, 80],
            96: [55, 0, 80],
            98: [50, 0, 80],
            100: [45, 0, 100],
            102: [40, 0, 100],
            104: [35, 0, 100],
            106: [30, 45, 100],
            108: [25, 90, 75],
            110: [20, 90, 75],
            112: [15, 90, 50],
            114: [10, 40, 50],
            116: [5, 0, 25],
            118: [0, 0, 25],
            120: [0, 0, 0]
        },
        failure: {
            45: [3, 3, 1],
            70: [1, 3, 1],
            80: [0, 3, 2]
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
                  function(state, ui) {},
                  $("#dialog-game-mode"));

    modes.activateFirstMode();
});
