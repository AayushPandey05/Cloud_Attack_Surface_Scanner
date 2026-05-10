# This file tells Terraform what AWS resources to create
# We are creating two S3 buckets - one safe, one on purpose unsafe
# so our scanner has something to find

provider "aws" {
  region = "ap-south-1"
}

# BUCKET 1 - This is a SAFE bucket (public access is blocked)
resource "aws_s3_bucket" "safe_bucket" {
  bucket = "scanner-safe-bucket-12345"
}

resource "aws_s3_bucket_public_access_block" "safe_bucket" {
  bucket = aws_s3_bucket.safe_bucket.id

  block_public_acls   = true
  block_public_policy = true
}

# BUCKET 2 - This is UNSAFE on purpose so our scanner can detect it
resource "aws_s3_bucket" "unsafe_bucket" {
  bucket = "scanner-unsafe-bucket-12345"
}

resource "aws_s3_bucket_public_access_block" "unsafe_bucket" {
  bucket = aws_s3_bucket.unsafe_bucket.id

  block_public_acls   = false
  block_public_policy = false
}

# Print the bucket names when terraform apply finishes
output "safe_bucket_name" {
  value = aws_s3_bucket.safe_bucket.bucket
}

output "unsafe_bucket_name" {
  value = aws_s3_bucket.unsafe_bucket.bucket
}
