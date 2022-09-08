const fs = require('fs');

(async () => {
    // for (let i = 1; i <= 3375; i++){
    //     fs.mkdirSync(`E:/MetaLand/Image/content/${i}/`);
    //     fs.copyFileSync('E:/MetaLand/Image/1', `E:/MetaLand/Image/content/${i}/content`);
    //     console.log(i);
    // }
    for (let i = 1; i <= 3375; i++ ){
        console.log(i);
        const x = Math.floor((i - 1) / 225) - 7;
        const y = Math.floor(((i - 1) % 225)/15) - 7;
        const z = ((i - 1) % 15) - 7;

        const metadata = {
            name: `Metaverse [${x}, ${y}, ${z}]`,
            description: "MetaMetaverse collection",
            image: `https://metaverse-nft-metadata-images.s3.eu-central-1.amazonaws.com/content/${i}/content`,//'ipfs://bafybeiadugprli2vr5mr4l4qvim6kaulpn5ddgsdzy7l4yll24t3usmaym',
            "external_url": `https://map.metametaverse.io/metamap?zoomTo=x${x}y${y}z${z}`,
            attributes: [
                {trait_type: 'X', value: x.toString()},
                {trait_type: 'Y', value: y.toString()},
                {trait_type: 'Z', value: z.toString()},
                {trait_type: 'Tier', value: '0'}
            ]
        };

        fs.writeFileSync(`E:/MetaLand/Metadata/${i}`, JSON.stringify(metadata),);
    }
})().then(_ => console.log('done'));