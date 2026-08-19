import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Victory Key",
  description: "Learn about how we collect, use, and protect your personal information, including cookies and Google AdSense policies.",
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="mb-4">
              At The Victory Key, accessible from thevictorykey.com, one of our main priorities is the privacy of our visitors. 
              This Privacy Policy document contains types of information that is collected and recorded by The Victory Key 
              and how we use it.
            </p>
            <p className="mb-4">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support.
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account information (name, email address)</li>
              <li>Profile information and preferences</li>
              <li>Learning progress and exam results</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect in various ways, including to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Track your learning progress and provide personalized content</li>
              <li>Improve, personalize, and expand our website and services</li>
              <li>Understand and analyze how you use our website</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Log Files</h2>
            <p className="mb-4">
              The Victory Key follows a standard procedure of using log files. These files log visitors when they visit websites. 
              All hosting companies do this and a part of hosting services' analytics. The information collected by log files 
              includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, 
              referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. 
              The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, 
              and gathering demographic information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cookies and Web Beacons</h2>
            <p className="mb-4">
              Like any other website, The Victory Key uses "cookies". These cookies are used to store information including 
              visitors' preferences, and the pages on the website that the visitor accessed or visited. The information 
              is used to optimize the users' experience by customizing our web page content based on visitors' browser type 
              and/or other information.
            </p>
          </section>

          <section className="bg-muted p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Google DoubleClick DART Cookie</h2>
            <p className="mb-4 text-foreground">
              Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads 
              to our site visitors based upon their visit to thevictorykey.com and other sites on the internet. However, 
              visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy 
              at the following URL –{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://policies.google.com/technologies/ads
              </a>
            </p>
            <p className="text-foreground">
              Users can choose to disable or selectively turn off our cookies or third-party cookies in their browser settings, 
              or by managing preferences in security programs. You can also opt-out of personalized advertising by visiting{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Ads Settings
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Our Advertising Partners</h2>
            <p className="mb-4">
              Some of advertisers on our site may use cookies and web beacons. Our advertising partners include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>Google AdSense:</strong> Privacy Policy details can be consulted at{" "}
                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://policies.google.com/technologies/ads
                </a>
              </li>
            </ul>
            <p className="mb-4">
              Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are 
              used in their respective advertisements and links that appear on The Victory Key, which are sent directly 
              to users' browser. They automatically receive your IP address when this occurs. These technologies are used 
              to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content 
              that you see on websites that you visit.
            </p>
            <p className="mb-4">
              Note that The Victory Key has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Third Party Privacy Policies</h2>
            <p className="mb-4">
              The Victory Key's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you 
              to consult the respective Privacy Policies of these third-party ad servers for more detailed information. 
              It may include their practices and instructions about how to opt-out of certain options.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
            <p className="mb-4">Under the CCPA, among other rights, consumers have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.</li>
              <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
              <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
            </ul>
            <p className="mb-4">
              If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. GDPR Data Protection Rights</h2>
            <p className="mb-4">We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>The right to access</strong> – You have the right to request copies of your personal data. We may charge you a small fee for this service.</li>
              <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.</li>
              <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
              <li><strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.</li>
              <li><strong>The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:Consultantstvk@gmail.com" className="text-primary hover:underline font-semibold">
                Consultantstvk@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}