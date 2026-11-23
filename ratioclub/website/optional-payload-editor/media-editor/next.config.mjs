import {withPayload} from '@payloadcms/next/withPayload';
export default withPayload({poweredByHeader:false,turbopack:{root:process.cwd()},experimental:{serverActions:{bodySizeLimit:'55mb'}}});
