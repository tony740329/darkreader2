import {getSVGFilterMatrixValue} from '../../generators/svg-filter';
import {bgFetch} from './network';
import {getURLHost} from '../../utils/url';
import {loadAsDataURL} from '../../utils/network';
import {FilterConfig} from '../../definitions';

export interface ImageDetails {
    src: string;
    dataURL: string;
    width: number;
    height: number;
    isDark: boolean;
    isLight: boolean;
    isTransparent: boolean;
    isLarge: boolean;
}

const FaviconSelector = "link[rel='icon'], link[rel='shortcut icon']";

function invertFavicon(favicon: HTMLImageElement) {
    const MAX_ANALIZE_PIXELS_COUNT = 32 * 32;

    const naturalPixelsCount = favicon.naturalWidth * favicon.naturalHeight;
    const k = Math.min(1, Math.sqrt(MAX_ANALIZE_PIXELS_COUNT / naturalPixelsCount));
    const width = Math.max(1, Math.round(favicon.naturalWidth * k));
    const height = Math.max(1, Math.round(favicon.naturalHeight * k));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(favicon, 0, 0);
    const imgData = ctx.getImageData(0, 0, favicon.width, favicon.height);
    const data = imgData.data;

    const DARK_LIGHTNESS_THRESHOLD = 0.4;
    const TRANSPARENT_ALPHA_THRESHOLD = 0.05;

    let i: number, x: number, y: number;
    let r: number, g: number, b: number, a: number;
    let p: number;
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            i = 4 * (y * width + x);
            r = data[i + 0] / 255;
            g = data[i + 1] / 255;
            b = data[i + 2] / 255;
            a = data[i + 3] / 255;

            if (a < TRANSPARENT_ALPHA_THRESHOLD) {
                continue;
            } else {
                // Use HSP to determine the `pixel Lightness`
                // http://alienryderflex.com/hsp.html & https://stackoverflow.com/a/24213274/13569411
                p = Math.sqrt(0.299 * r^2 + 0.587 * g^2 + 0.114 * b^2)
                if (p < DARK_LIGHTNESS_THRESHOLD) {
                    data[i + 0] = 255 - data[i + 0];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
            }
        }
    }

 	ctx.putImageData(imgData, 0, 0);
 	return canvas.toDataURL();
}

export async function checkFavicon() {
    const favicon = document.querySelector(FaviconSelector) as HTMLLinkElement;
    if (favicon) {
        const info = await getImageDetails(favicon.href);
        if (info.isDark) {
	        const image = new Image();
	        image.crossOrigin = 'anonymous';
	        image.onload = function () {
	 	        favicon.href = invertFavicon(image);
	        };
            image.src = favicon.href;
        }
    }
}

export async function getImageDetails(url: string) {
    let dataURL: string;
    if (url.startsWith('data:')) {
        dataURL = url;
    } else {
        dataURL = await getImageDataURL(url);
    }
    if (dataURL === 'data:') { // Image URL's that redirect to non image causes to return data:.
        return null;
    }
    const image = await urlToImage(dataURL);
    const info = analyzeImage(image);
    return {
        src: url,
        dataURL,
        width: image.naturalWidth,
        height: image.naturalHeight,
        ...info,
    };
}

async function getImageDataURL(url: string) {
    if (getURLHost(url) === location.host) {
        return await loadAsDataURL(url);
    }
    return await bgFetch({url, responseType: 'data-url'});
}

async function urlToImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(`Unable to load image ${url}`);
        image.src = url;
    });
}


function analyzeImage(image: HTMLImageElement) {
    const MAX_ANALIZE_PIXELS_COUNT = 32 * 32;

    const naturalPixelsCount = image.naturalWidth * image.naturalHeight;
    const k = Math.min(1, Math.sqrt(MAX_ANALIZE_PIXELS_COUNT / naturalPixelsCount));
    const width = Math.max(1, Math.round(image.naturalWidth * k));
    const height = Math.max(1, Math.round(image.naturalHeight * k));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const d = imageData.data;

    const TRANSPARENT_ALPHA_THRESHOLD = 0.05;
    const DARK_LIGHTNESS_THRESHOLD = 0.4;
    const LIGHT_LIGHTNESS_THRESHOLD = 0.7;

    let transparentPixelsCount = 0;
    let darkPixelsCount = 0;
    let lightPixelsCount = 0;

    let i: number, x: number, y: number;
    let r: number, g: number, b: number, a: number;
    let l: number, min: number, max: number;
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            i = 4 * (y * width + x);
            r = d[i + 0] / 255;
            g = d[i + 1] / 255;
            b = d[i + 2] / 255;
            a = d[i + 3] / 255;

            if (a < TRANSPARENT_ALPHA_THRESHOLD) {
                transparentPixelsCount++;
            } else {
                min = Math.min(r, g, b);
                max = Math.max(r, g, b);
                l = (max + min) / 2;
                if (l < DARK_LIGHTNESS_THRESHOLD) {
                    darkPixelsCount++;
                }
                if (l > LIGHT_LIGHTNESS_THRESHOLD) {
                    lightPixelsCount++;
                }
            }
        }
    }

    const totalPixelsCount = width * height;
    const opaquePixelsCount = totalPixelsCount - transparentPixelsCount;

    const DARK_IMAGE_THRESHOLD = 0.7;
    const LIGHT_IMAGE_THRESHOLD = 0.7;
    const TRANSPARENT_IMAGE_THRESHOLD = 0.1;
    const LARGE_IMAGE_PIXELS_COUNT = 800 * 600;

    return {
        isDark: ((darkPixelsCount / opaquePixelsCount) >= DARK_IMAGE_THRESHOLD),
        isLight: ((lightPixelsCount / opaquePixelsCount) >= LIGHT_IMAGE_THRESHOLD),
        isTransparent: ((transparentPixelsCount / totalPixelsCount) >= TRANSPARENT_IMAGE_THRESHOLD),
        isLarge: (naturalPixelsCount >= LARGE_IMAGE_PIXELS_COUNT),
    };
}

export function getFilteredImageDataURL({dataURL, width, height}: ImageDetails, filter: FilterConfig) {
    const matrix = getSVGFilterMatrixValue(filter);
    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">`,
        '<defs>',
        '<filter id="darkreader-image-filter">',
        `<feColorMatrix type="matrix" values="${matrix}" />`,
        '</filter>',
        '</defs>',
        `<image width="${width}" height="${height}" filter="url(#darkreader-image-filter)" xlink:href="${dataURL}" />`,
        '</svg>',
    ].join('');
    const bytes = new Uint8Array(svg.length);
    for (let i = 0; i < svg.length; i++) {
        bytes[i] = svg.charCodeAt(i);
    }
    const blob = new Blob([bytes], {type: 'image/svg+xml'});
    const objectURL = URL.createObjectURL(blob);
    return objectURL;
}
