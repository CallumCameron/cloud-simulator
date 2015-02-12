var compute_demand = 0;
var network_demand = 0;
var storage_demand = 0;

var compute_provision = 0;
var network_provision = 0;
var storage_provision = 0;



var create_slider = function(name, max, callback, tooltip) {
    var column = $('<div>').addClass('panel-column');
    var slider = $('<div>').addClass('slider-slider').attr('id', name + '-slider');
    var text = $('<p>').addClass('slider-text').attr('id', name + '-text').text('0');
    var img = $('<img>').addClass('slider-img').attr('src', 'placeholder.png').attr('title', tooltip);

    column.append(slider, text, img);

    slider.slider({
        orientation: 'vertical',
        range: 'min',
        min: 1,
        max: max,
        value: 1,
        slide: function(event, ui) {
            text.text(slider.slider('value'));
            callback();
        },
        changed: function(event, ui) {
            text.text(slider.slider('value'));
            callback();
        }
    });

    text.text(slider.slider('value'));

    return column;
};

var create_load_box = function(name) {
    return $('<div>').addClass('panel-column').append(
        $('<div>').addClass('load-box-colour').attr('id', name + '-load-box'),
        $('<p>').addClass('load-box-text').append(
            $('<span>').attr('id', name + '-load-text').text('0'),
            '%'
        )
    );
};

var update_clients = function() {
    var clients = parseInt($('#clients-text').text());

    compute_demand = 1 * clients;
    network_demand = 4 * clients;
    storage_demand = 2 * clients;

    update_load();
};

var update_cloud = function() {
    compute_provision = parseInt($('#compute-text').text());
    network_provision = parseInt($('#network-text').text());
    storage_provision = parseInt($('#storage-text').text());

    $('#cost-money').text(compute_provision + 2 * storage_provision + 3 * network_provision);
    $('#cost-power').text(network_provision + 2 * storage_provision + 3 * compute_provision);

    update_load();
};

var update_load = function()
{
    var update_individual_load = function(demand, provision, name) {
        var load = Math.round(demand / provision * 100);
        $('#' + name + '-load-text').text(load);

        var h = 0;

        if (load < 0) {
            h = 120;
        }
        else if (load > 100) {
            h = 0;
        }
        else {
            h = Math.round((1 - (load / 100)) * 120);
        }

        $('#' + name + '-load-box').attr('style', 'background-color: hsl(' + h + ', 80%, 50%);');
    };

    update_individual_load(compute_demand, compute_provision, 'compute');
    update_individual_load(network_demand, network_provision, 'network');
    update_individual_load(storage_demand, storage_provision, 'storage');

};

var main = function() {
    $('#response-section').append(
        create_load_box('response')
    );

    $('#demand-section').append(
        create_slider('clients', 100, update_clients, 'Clients')
    );

    $('#load-section').append(
        create_load_box('compute'),
        create_load_box('network'),
        create_load_box('storage')
    );

    $('#provision-section').append(
        create_slider('compute', 100, update_cloud, 'Computation: processors'),
        create_slider('network', 100, update_cloud, 'Network: connectivity'),
        create_slider('storage', 100, update_cloud, 'Storage: hard drives and SSDs')
    );

    update_clients();
    update_cloud();

    $(document).tooltip();
}

$(document).ready(main);
