LiveKit Docs › Self-hosting › Kubernetes

---

# Deploy to Kubernetes

> Deploy LiveKit to Kubernetes.

LiveKit streamlines deployment to Kubernetes. We publish a [Helm chart](https://github.com/livekit/livekit-helm) that help you set up a distributed deployment of LiveKit, along with a Service and Ingress to correctly route traffic. Our Helm chart supports Google GKE, Amazon EKS, and Digital Ocean DOKS out of the box, and can serve as a guide on your custom Kubernetes installations.

> ❗ **Important**
> 
> LiveKit does not support deployment to serverless and/or private clusters. Private clusters have additional layers of NAT that make it unsuitable for WebRTC traffic.

## Understanding the deployment

LiveKit pods requires direct access to the network with host networking. This means that the rtc.udp/tcp ports that are open on those nodes are directly handled by LiveKit server. With that direct requirement of specific ports, it means we'll be limited to one LiveKit pod per node. It's possible to run other workload on those nodes.

Termination of TLS/SSL is left as a responsibility of the Ingress. Our Helm chart will configure TLS termination for GKE and ALB load balancers. To use ALB on EKS, AWS Load Balancer Controller needs to be [installed separately](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html).

![Kubernetes Deployment](/images/diagrams/deploy-kubernetes.svg)

### Graceful restarts

During an upgrade deployment, older pods will need to be terminated. This could be extremely disruptive if there are active sessions running on those pods. LiveKit handles this by allowing that instance to drain prior to shutting down.

We also set `terminationGracePeriodSeconds` to 5 hours in the helm chart, ensuring Kubernetes gives sufficient time for the pod to gracefully shut down.

## Using the Helm Chart

## Pre-requisites

To deploy a multi-node cluster that autoscales, you'll need:

- a Redis instance
- SSL certificates for primary domain and TURN/TLS
- a Kubernetes cluster on AWS, GCloud, or DO
- [Helm](https://helm.sh/docs/intro/install/) is installed on your machine.

Then add the LiveKit repo

```shell
$ helm repo add livekit https://helm.livekit.io

```

Depending on your cloud provider, the following pre-requisites may be required

**AWS**:

On AWS, it's recommended to use ALB Ingress Controller as the main load balancer for LiveKit's signal connection. You can find installation instructions [here](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html).

With ALB, you could also used ACM to handle TLS termination for the primary domain. However, a SSL certificate is still needed in order to use the embedded TURN/TLS server.

---

**Digital Ocean**:

Digital Ocean requires Nginx Ingress Controller and Cert Manager to be installed.

**Nginx Ingress Controller**

```shell
$ helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
$ helm repo update
$ helm install nginx-ingress ingress-nginx/ingress-nginx --set controller.publishService.enabled=true

```

**Cert Manager**

```shell
$ kubectl create namespace cert-manager
$ helm repo add jetstack https://charts.jetstack.io
$ helm repo update
$ helm install cert-manager jetstack/cert-manager --namespace cert-manager --version v1.8.0 --set installCRDs=true

```

Then create a YAML file `cluster_issuer.yaml` with content below to configure it to use LetsEncrypt.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Email address used for ACME registration
    email: <your-email-address>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-private-key
    # Add a single challenge solver, HTTP01 using nginx
    solvers:
      - http01:
          ingress:
            class: nginx

```

Then create the `ClusterIssuer` object

```shell
kubectl apply -f cluster_issuer.yaml

```

Create a values.yaml for your deployment, using [server-sample.yaml](https://github.com/livekit/livekit-helm/blob/master/server-sample.yaml) as a template.

Checkout [Helm examples](https://github.com/livekit/livekit-helm/tree/master/examples) for AWS, Google Cloud, and Digital Ocean.

### Importing SSL Certificates

In order to set up TURN/TLS and HTTPS on the load balancer, you may need to import your SSL certificate(s) into as a Kubernetes Secret. This can be done with:

```shell
kubectl create secret tls <NAME> --cert <CERT-FILE> --key <KEY-FILE> --namespace <NAMESPACE>

```

Note, please ensure that the secret is created in the same namespace as the deployment.

### Install & Upgrade

```shell
helm install <INSTANCE_NAME> livekit/livekit-server --namespace <NAMESPACE> --values values.yaml

```

We'll publish new version of the chart with new server releases. To fetch these updates and upgrade your installation, perform

```shell
helm repo update
helm upgrade <INSTANCE_NAME> livekit/livekit-server --namespace <NAMESPACE> --values values.yaml

```

If any configuration has changed, you may need to trigger a restart of the deployment. Kubernetes triggers a restart only when the pod itself has changed, but does not when the changes took place in the ConfigMap.

### Firewall

Ensure that your [firewall](https://docs.livekit.io/home/self-hosting/ports-firewall.md#firewall) is configured properly to allow traffic into LiveKit ports.

---

This document was rendered at 2025-09-27T09:36:41.711Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/kubernetes.md](https://docs.livekit.io/home/self-hosting/kubernetes.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).