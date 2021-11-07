import http from 'k6/http';
import { check, group } from "k6";
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { parseHTML } from 'k6/html';

const PROTOCOL = 'http://';
const BASE_URL = 'www.load-test.ru';
const PORT = '1080';
const login = 'pojo';
const password = 'pean';

export default function(){
    group("get_welcome", function(){get_welcome()});
    group("get_home", function(){get_home()});
    group("post_login", function(){post_login()});
    group("get_welcome_page", function(){get_welcome_page()});
    group("get_reservation", function(){get_reservation()});
    group("post_reservation", function(){post_reservation()});
    group("post_flights", function(){post_flights()});
    group("post_buy", function(){post_buy()});
    group("get_welcome_page", function(){get_welcome_page()});
};

let cookie;
let token;

let departCity;
let arrivalCity;
let departDate;
let returnDate;
let outboundFlightNumber;

export function get_welcome() {
    let res = http.get(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/welcome.pl?signOff=true'));
    check(res, {
        'status code is 200': (res) => res.status == 200,
    });
    const jar = http.cookieJar();
    cookie = jar.cookiesForURL(BASE_URL);
};

export function get_home(){
    let res = http.get(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/nav.pl?in=home'), { responseType: 'text' });
    check(res, {
        'status code is 200': (res) => res.status == 200,
    });
    const elem = res.html().find('input[name=userSession]');
    token = elem.attr('value');
};

export function post_login(){
    const payload = {
        userSession: token,
        username: login,
        password: password,
        'login.x': 60,
        'login.y': 6,
        JSFormSubmit: 'off'
    };
    let res = http.post(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/login.pl'), payload, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    check(res, {
        'status code is 200': (res) => res.status == 200,
    });
};

export function get_reservation(){
    let res = http.get(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/reservations.pl?page=welcome'), { responseType: 'text' });
    check(res, {
        'status code is 200': (res) => res.status == 200,
    });
    const departList = res.html().find('[name=depart]').children();
    departCity = departList.get(Math.floor(Math.random()*departList.size())).textContent();
    arrivalCity = departList.get(Math.floor(Math.random()*departList.size())).textContent();

    const departElem = res.html().find('[name=departDate]');
    departDate = departElem.attr('value');

    const returnElem = res.html().find('[name=returnDate]');
    returnDate = returnElem.attr('value');
};

export function post_reservation(){
    const payload = {
        advanceDiscount: 0,
        depart: departCity,
        departDate: departDate,
        arrive: arrivalCity,
        returnDate: returnDate,
        numPassengers: 1,
        seatPref: 'None',
        seatType: 'Coach',
        'findFlights.x': 54,
        'findFlights.y': 4,
        '.cgifields': 'roundtrip',
        '.cgifields': 'seatType',
        '.cgifields': 'seatPref',
    };
    let res = http.post(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/reservations.pl'), payload, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}, { responseType: 'text' });
    check(res, {
        'status code is 200': (res) => res.status == 200,
    });

    const doc = res.html().find('[name=outboundFlight]');
    outboundFlightNumber = doc.get(Math.floor(Math.random()*doc.size())).getAttribute('value');
};

export function post_flights(){
    const payload = {
        outboundFlight: outboundFlightNumber,
        numPassengers: 1,
        advanceDiscount: 0,
        seatType: 'Coach',
        seatPref: 'None',
        'reserveFlights.x': 58,
        'reserveFlights.y': 6,
    };
    let res = http.post(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/reservations.pl'), payload, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    check(res, {
        'status code is 200': (res) => res.status == 200,
        'page header is correct': (res_check) => res_check.html('b').text() == 'Payment Details',
    });
}

export function post_buy(){
    const payload = {
        firstName: 'Denis',
        lastName: 'Zhukov',
        numPassengers: 1,
        seatType: 'Coach',
        seatPref: 'None',
        returnFlight: '',
        outboundFlight: outboundFlightNumber,
        advanceDiscount: 0,
        'buyFlights.x': 48,
        'buyFlights.y': 15,
        '.cgifields': 'saveCC',
    };
    let res = http.post(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/reservations.pl'), payload, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    check(res, {
        'status code is 200': (res) => res.status == 200,
        'page header is correct': (res_check) => res_check.html('small b').text() == 'Thank you for booking through Web Tours.',
    });
}

export function get_welcome_page() {
    let res_check = http.get(PROTOCOL.concat(BASE_URL, ':', PORT, '/cgi-bin/login.pl?intro=true'));
    check(res_check, {
        'status code is 200': (res_check) => res_check.status == 200,
        'user is correct': (res_check) => res_check.html('b').text() == login,
    });
}