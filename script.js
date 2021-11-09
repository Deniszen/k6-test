import http from 'k6/http';
import { check } from "k6";
import { sleep } from 'k6';

const YA_URL = 'http://ya.ru';
const WWW_URL = 'http://www.ru';

export let options = {
        discardResponseBodies: true,
        scenarios: {
            get_ya_scenario: {
                exec: 'get_ya',
                executor: 'ramping-arrival-rate',
                startRate: 1,
                timeUnit: '1s',
                preAllocatedVUs: 50,
                maxVUs: 100,
                stages: [
                    { target: 6, duration: '5m' },
                    { target: 6, duration: '10m' },
                    { target: 7, duration: '5m' },
                    { target: 7, duration: '10m' },
                ],
            },
            get_www_scenario: {
                exec: 'get_ya',
                executor: 'ramping-arrival-rate',
                startRate: 2,
                timeUnit: '1s',
                preAllocatedVUs: 50,
                maxVUs: 100,
                stages: [
                    { target: 12, duration: '5m' },
                    { target: 12, duration: '10m' },
                    { target: 14, duration: '5m' },
                    { target: 14, duration: '10m' },
                ],
            },
        },
};

export function get_ya() {
    let res_ya = http.get(YA_URL);
    check(res_ya, {
        'status was 200': (r) => r.status == 200
    });
    sleep(1);
};

export function get_www() {
    const res_www = http.get(WWW_URL);
    check(res_www, {
        'status was 200': (r) => r.status == 200
    });
    sleep(1);
};