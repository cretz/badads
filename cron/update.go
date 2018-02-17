package update

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"golang.org/x/net/context"
	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/urlfetch"
)

func init() {
	http.HandleFunc("/", handler)
}

func handler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	if err := runUpdate(ctx); err != nil {
		log.Errorf(ctx, "Failed running update: %v", err)
		http.Error(w, "Failed", http.StatusInternalServerError)
	}
}

func runUpdate(ctx context.Context) error {
	// Build request
	body, err := json.Marshal(map[string]string{
		"clientId":     os.Getenv("BADADS_CLIENT_ID"),
		"clientSecret": os.Getenv("BADADS_CLIENT_SECRET"),
		"refreshToken": os.Getenv("BADADS_REFRESH_TOKEN"),
		"repoPassword": os.Getenv("BADADS_REPO_PASSWORD"),
	})
	if err != nil {
		return fmt.Errorf("Failed marshalling JSON: %v", err)
	}
	req, err := http.NewRequest("POST", os.Getenv("BADADS_HTTP_URI"), bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("Failed creating request: %v", err)
	}
	req.SetBasicAuth(os.Getenv("BADADS_HTTP_USERNAME"), os.Getenv("BADADS_HTTP_PASSWORD"))
	req.Header.Set("Content-Type", "application/json")
	// Send
	client := urlfetch.Client(ctx)
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Failed to send request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Failure on trigger side: %v", resp.Status)
	}
	return nil
}
