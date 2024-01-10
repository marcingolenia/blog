---
title: Let's try .net LinkGenerator, will it make working with links easier?
description: >-
    This is a continuation to "HATEOAS in F#" post. Let's try to simplify link generatrion in our Hogwarts accommodation API. 
date: 2024-01-08T23:29:21+05:30
draft: true
tags:
  - fsharp
  - rest
image: /images/restglory.png
---
## Intro
Some libraries have built-in mechanics which can help us in creating HATEOAS. In spring we have `WebMvcLinkBuilder`, in .net MVC we have `IUrlHelper`, now in .net core minimal APIs we have `LinkGenerator`. Let's check if this can actually help. 

### What is LinkGenerator
From MSDN [1] docs:

> LinkGenerator efines a contract to generate absolute and related URIs based on endpoint routing.

I've found an example in C# on a blog: 

Endpoints:
```csharp
app.MapGet("/messages", Ok<List<TextMessageDto>> () =>
{
    List<TextMessageDto> textMessages = new()
    {
        new TextMessageDto { Id = 1, Message = "Hello, World!"},
        new TextMessageDto { Id = 1, Message = "Yet another Hello, World!"}
    };
    return TypedResults.Ok(textMessages);
})
.WithName("readmessages");

app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id) =>
{
    //TODO : Implement a lookup for messages
    return TypedResults.Ok(new TextMessageDto { Id = id, Message = $"Hello, World! The id is {id}" });
})
.WithName("readmessagebyid");

app.MapPost("/messages", (...) =>
{
    //save the message
})
.WithName("savemessage");

app.MapPut("/messages/{id}", (...) =>
{
    //update message
})
.WithName("updatemessage");

app.MapDelete("/messages/{id}", (...) =>
{
    //delete message
})
.WithName("deletemessage");
```

Using link generator:
```csharp
//use the LinkGenerator class to build the url for each endpoint by using the endpointname associated with each endpoint 
app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id, HttpContext httpContext, LinkGenerator linkGenerator) =>
{
    TextMessageDto textMessage = new() { Id = id, Message = $"Hello, World from {id}" };
    List<LinkDto> links = new()
    {
        new LinkDto(linkGenerator.GetUriByName(httpContext, "readmessagebyid",values: new{id})!, "self", "GET"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "updatemessage",values: new{id})!, "update_message", "PUT"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "deletemessage",values: new{id})!, "delete_message", "DELETE")
    };
    textMessage.Links = links;
    return TypedResults.Ok(textMessage);
})
.WithName("readmessagebyid");
```
I see some tradeoffs:
1. It looks that it can save us from some troubles when we want to do some changes in our API that involve changing URI paths as we 
can refer to an endpoint by name instead of the full API path, but we have to bother now with naming the endpoints.
2. We don't have to hardcode paths versus we have to hardcode endpoint names. 
3. While in C# we can get some extra typesafety (in C# string interpolation actually doesn't check the types), we can have the same benefit in F# by using typed interpolated strings, so let's pretend that this point doesn't exist (as this is blog post about F# not C#).

So... I am somewhat sceptical but let's go. We have to try it, before I can make an opinion.

## Adding link generator to our existing API




## Conclusions



```fsharp
let readHouses: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let data =
            houses
            |> List.map (fun house ->
                { Name = house.Name.ToString()
                  Links =
                    [ { Rel = "self"
                        Href = $"/accommodation/houses/{house.Name.ToString()}" }
                      { Rel = "all_students"
                        Href = $"/accommodation/houses/{house.Name.ToString()}/students" }
                    ] })

        json data next ctx
```



---
**References:**\
[1] [MSDN LinkGenerator](https://learn.microsoft.com/pl-pl/dotnet/api/microsoft.aspnetcore.routing.linkgenerator)\
[2] [Minimal APIs and HATEOAS, Poornima Nayar](https://poornimanayar.co.uk/blog/minimal-apis-and-hateoas)\
[3] https://github.com/giraffe-fsharp/Giraffe/issues/569
