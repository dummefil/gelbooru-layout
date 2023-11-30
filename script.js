// ==UserScript==
// @name         Gelbooru upgrade
// @namespace    https://github.com/dummefil/gelbooru-layout-upgrade
// @version      1.0.0
// @description  Set of QOL features to make gelbooru more user-friendly
// @author       https://github.com/dummefil
// @match        https://gelbooru.com/*
// @grant        none
// ==/UserScript==

"use strict";

const storage = localStorage;

const stringToBoolean = (string) => {
    return string === 'true';
}

const config = {
    sliderEnabled: stringToBoolean(storage.getItem('sliderEnabled')) || false,
    sliderTime: parseInt(storage.getItem('sliderTime')) || 2000,
    skipImage: stringToBoolean(storage.getItem('skipImage')) || false,
    skipVideo: stringToBoolean(storage.getItem('skipVideo')) || false,
}

const configHandler = {
    set(target, propertyName, propertyValue) {
        storage.setItem(propertyName, propertyValue);
        target[propertyName] = propertyValue
        return true;
    }
}

const configProxy = new Proxy(config, configHandler);

const logger = (() => {
    const prefix = '[GELBOORU_UPGRADE]:';
    const keys = [
        'info',
        'warn',
        'error',
        'debug',
    ]
    const obj = {};
    keys.forEach((key) => obj[key] = (msg) => console[key](prefix, msg))
    return obj;
})()

const next = () => {
    logger.debug('Next image/video triggered');
    navigateNext();
}

const prev = () => {
    logger.debug('Prev image/video triggered');
    navigatePrev();
}

const handleImage = (image) => {
    image.ready(() => {
        timeout(next)
    })
}

const timeout = (cb) => {
    return setTimeout(() => {
        cb()
    }, configProxy.sliderTime);
}

const handleVideo = (video) => {
    video.loop = false;
    video.onended = () => {
        next();
    }
    video.oncanplay = function () {
        video.play();
        logger.debug(`Video duration: ${this.duration * 1000}`);
    };
}

function startSlider() {
    const image = $("picture img");
    const video = $("#gelcomVideoPlayer");

    logger.debug(`image: ${image}`);
    logger.debug(`video: ${video}`);

    const isImage = image.length === 1;
    const isVideo = video.length === 1;
    const isGallery = $('.thumbnail-preview').length > 1;

    if (isGallery) {
        return;
    }

    logger.debug(`isImage ${isImage}, isVideo ${isVideo}`);

    if (isImage) {
        if (configProxy.skipImage) {
            logger.debug('Skipping image');
            next();
        } else {
            logger.debug('Using image handler')
            handleImage(image);
        }
    }

    //todo play video on ready;
    if (isVideo) {
        if (configProxy.skipVideo) {
            logger.debug('Skipping video');
            next();
        } else {
            logger.debug('Using video handler')
            handleVideo(video[0])
        }
    }

    if (!isImage && !isVideo) {
        logger.debug('Using fallback handler')
        timeout(next);
    }
}

const createHTMLElement = (tag, props = {}) => {
    const element = document.createElement(tag);
    Object.entries(props).forEach(([propName, propValue]) => {
        if (propName !== 'content') {
            element.setAttribute(propName, propValue);
        }
    })
    if (props.content) {
        element.textContent = props.content;
    }

    return element;
}

const objectNotEmpty = (obj) => {
    return Object.values(obj).length !== 0;
}

const createInputWithLabel = ({label, ...props}) => {
    const inputElement = createInput(props);
    const labelElement = createHTMLElement('label', { content: label });
    const containerElement = createHTMLElement('div', { class: 'checkbox-wrapper' });
    attachElementsToContainer(containerElement, [labelElement, inputElement])
    return containerElement;
}

const createInput = ({ checked, type, value, listeners = {}, content }) => {
    const props = { type };
    if (checked) {
        props.checked = '';
    }
    if (value) {
        props.value = value;
    }

    const element = createHTMLElement('input', props);
    if (objectNotEmpty(listeners)) {
        Object.entries(listeners).forEach(([listenerName, listenerHandler]) => {
            element.addEventListener(listenerName, listenerHandler);
        })
    }
    return element;
}

const attachElementsToContainer = (container, elements) => {
    if (Array.isArray(elements)) {
        elements.forEach((element) => {
            container.appendChild(element)
        })
    }
}

const createNextButton = () => {
    const buttonProps = {
        type: 'button',
        class: 'searchList',
        value: 'Next',
        listeners: {
            click: next,
        },
    }
    return createInput(buttonProps);
}

const createPrevButton = () => {
    const buttonProps = {
        type: 'button',
        class: 'searchList',
        value: 'Prev',
        listeners: {
            click: prev,
        },
    }
    return createInput(buttonProps);
}



const createSliderTimeInput = () => {
    const inputProps = {
        label: 'Slider time',
        type: 'number',
        value: configProxy.sliderTime,
        listeners: {
            change(event) {
                event.stopPropagation();
                configProxy.sliderTime = event.target.value;
                location.reload();
            }
        }
    }

    return createInputWithLabel(inputProps)
}

const checkboxChangeEvent = (event, configProp, loggerPrefix) => {
    event.stopPropagation();
    logger.debug(`${loggerPrefix} ${event.target.checked ? 'enabled' : 'disabled'}`);
    configProxy[configProp] = event.target.checked;
    location.reload();
}

const createEnableSliderCheckbox = () => {
    const inputProps = {
        label: 'Enable slider',
        type: 'checkbox',
        checked: configProxy.sliderEnabled,
        listeners: {
            change(event) {
                checkboxChangeEvent(event, 'sliderEnabled', 'Slider')
            }
        },
    }
    return createInputWithLabel(inputProps);
}

const createSkipImageCheckbox = () => {
    const inputProps = {
        label: 'Skip images',
        type: 'checkbox',
        checked: configProxy.skipImage,
        listeners: {
            change(event) {
                checkboxChangeEvent(event, 'skipImage', 'Skip images')
            }
        },
    }
    return createInputWithLabel(inputProps);
}

const createSkipVideoCheckbox = () => {
    const inputProps = {
        label: 'Skip video',
        type: 'checkbox',
        checked: configProxy.skipVideo,
        listeners: {
            change(event)  {
                checkboxChangeEvent(event, 'skipVideo', 'Skip video')
            }
        },
    }
    return createInputWithLabel(inputProps);
}

function createHTML() {
    const enableSliderCheckbox = createEnableSliderCheckbox();
    const skipImageCheckbox = createSkipImageCheckbox();
    const skipVideoCheckbox = createSkipVideoCheckbox();
    const prevButton = createPrevButton();
    const nextButton = createNextButton();
    const sliderTimeInput = createSliderTimeInput();

    const checkboxesElement = createHTMLElement('div', { class: 'checkboxes' });
    attachElementsToContainer(checkboxesElement, [
        skipImageCheckbox,
        skipVideoCheckbox,
    ])

    const searchFormElement = document.querySelector('[action="index.php?page=search"]');
    attachElementsToContainer(searchFormElement, [
        enableSliderCheckbox,
        checkboxesElement,
        prevButton,
        nextButton,
        sliderTimeInput
    ])
}

const showAsGallery = () => {
    const $container = $('#container');
    const $modifyContainer = $container.find('.thumbnail-container')
    if ($modifyContainer.length) {
        $container.addClass('gallery');
    }
}

const runtime = () => {
    if (location.href === 'https://gelbooru.com/') {
        return;
    }
    logger.debug(`Initialized with config ${JSON.stringify(configProxy)}`);
    createHTML();
    showAsGallery()

    if (configProxy.sliderEnabled) {
        startSlider();
    }
}

(() => runtime())();
