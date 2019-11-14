# HTTP & TLS/SSL

## CA(Certificate authority)

> In cryptography, a certificate authority or certification authority (CA) is an entity that issues digital certificates. 
> A digital certificate certifies the ownership of a public key by the named subject of the certificate. 
> This allows others (relying parties) to rely upon signatures or on assertions made about the private key that corresponds to the certified public key. 
> A CA acts as a trusted third party—trusted both by the subject (owner) of the certificate and by the party relying upon the certificate. 
> The format of these certificates is specified by the X.509 standard.

CA 作为可信第三方认证中心，核心在于能够为各方所信任。主要有以下5个功能：

- 证书的颁发：接收、验证用户(包括下级认证中心和最终用户)的数字证书的申请

- 证书的更新：定期更新所有用户的证书，或者根据用户的请求来更新用户的证书

- 证书的查询：查询用户证书申请处理状态，查询用户证书的颁发信息，这类查询由目录服务器 LDAP 来完成

- 证书的作废：由于用户私钥泄密等原因，需要向认证中心提出证书作废的请求；证书已经过了有效期，认证中心自动将该证书作废。通过维护证书作废列表 (Certificate Revocation List,CRL) 来完成

- 证书的归档：证书具有一定的有效期，证书过了有效期之后就将作废，但是我们不能将作废的证书简单地丢弃，因为有时我们可能需要验证以前的某个交易过程中产生的数字签名，这时我们就需要查询作废的证书

## HTTPS 协议分析

