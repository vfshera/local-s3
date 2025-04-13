import { LocalS3Storage } from "local-s3";
import { MEDIA_BUCKET_NAME } from "~/constants";

const ls3 = new LocalS3Storage();

(async () => {
  // Initialize the storage and create the bucket if it doesn't exist
  const buckets = await ls3.listBuckets();
  if (!buckets.some((bucket) => bucket.name === MEDIA_BUCKET_NAME)) {
    await ls3.createBucket(MEDIA_BUCKET_NAME);
  }
})();

export { ls3 };
