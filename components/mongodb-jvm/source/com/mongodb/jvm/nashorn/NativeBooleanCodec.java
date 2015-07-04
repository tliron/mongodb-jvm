/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import jdk.nashorn.internal.objects.NativeBoolean;

/**
 * A BSON codec for a Nashorn {@link NativeBoolean}.
 * 
 * @author Tal Liron
 */
public class NativeBooleanCodec implements Codec<NativeBoolean>
{
	//
	// Codec
	//

	public Class<NativeBoolean> getEncoderClass()
	{
		return NativeBoolean.class;
	}

	public void encode( BsonWriter writer, NativeBoolean value, EncoderContext encoderContext )
	{
		writer.writeBoolean( value.getValue() );
	}

	public NativeBoolean decode( BsonReader reader, DecoderContext decoderContext )
	{
		return (NativeBoolean) NativeBoolean.constructor( true, null, reader.readBoolean() );
	}
}
